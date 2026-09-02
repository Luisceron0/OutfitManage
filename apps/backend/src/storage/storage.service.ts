import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

// Allowlist de tipos MIME reales aceptados. La extensión de archivo se deriva de esta tabla,
// nunca del nombre de archivo declarado por el cliente (ver SEC-07 de la auditoría).
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export interface UploadedMulterFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  bucket: string;
  path: string;
  signedUrl: string;
  tipo: 'IMAGE' | 'VIDEO';
  originalName: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  // Se tipa desde el propio retorno de createClient (en vez de anotar `SupabaseClient`
  // explícitamente) para evitar un desajuste de parámetros genéricos entre versiones del SDK.
  private supabase: ReturnType<typeof createClient>;
  private readonly imagesBucket: string;
  private readonly videosBucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_KEY deben estar configurados. No hay valor por defecto.',
      );
    }

    this.imagesBucket =
      this.configService.get<string>('SUPABASE_BUCKET_IMAGES') ||
      'products_images';
    this.videosBucket =
      this.configService.get<string>('SUPABASE_BUCKET_VIDEOS') ||
      'products_videos';

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    this.logger.log(
      `Supabase Storage Service initialized. Buckets: Images=${this.imagesBucket}, Videos=${this.videosBucket}`,
    );
  }

  /**
   * Determina si el archivo es un video o una imagen según el mimetype
   */
  getMediaType(mimetypeOrUrl: string): 'IMAGE' | 'VIDEO' {
    if (
      mimetypeOrUrl.startsWith('video/') ||
      mimetypeOrUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)
    ) {
      return 'VIDEO';
    }
    return 'IMAGE';
  }

  /**
   * Sube un archivo al bucket correspondiente (imágenes o videos). El tipo de contenido, el
   * bucket destino y la extensión se derivan del MIME real del archivo (validado contra una
   * allowlist), nunca del nombre de archivo ni del mimetype declarados por el cliente.
   */
  async uploadFile(
    file: UploadedMulterFile,
    customFolder?: string,
  ): Promise<UploadResult> {
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Formatos aceptados: ${Object.keys(ALLOWED_MIME_TO_EXT).join(', ')}`,
      );
    }

    const isVideo = file.mimetype.startsWith('video/');
    const bucket = isVideo ? this.videosBucket : this.imagesBucket;
    const tipo = isVideo ? 'VIDEO' : 'IMAGE';

    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const folder = this.sanitizeFolder(customFolder);
    const filePath = `${folder}/${cleanFileName}`;

    this.logger.log(`Subiendo archivo a bucket ${bucket} en ruta ${filePath}`);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Error subiendo archivo a Supabase Storage: ${error.message}`,
        error,
      );
      throw new Error(`Error subiendo archivo a Supabase: ${error.message}`);
    }

    // Generar URL firmada válida por 7 días (604800 segundos)
    const signedUrl = await this.getSignedUrl(
      bucket,
      filePath,
      60 * 60 * 24 * 7,
    );

    return {
      bucket,
      path: data.path || filePath,
      signedUrl,
      tipo,
      originalName: file.originalname,
      size: file.size,
    };
  }

  /**
   * Reduce un nombre de carpeta propuesto por el cliente a segmentos alfanuméricos seguros,
   * sin separadores de ruta ni `..`, para que nunca escriba fuera del prefijo previsto.
   */
  private sanitizeFolder(customFolder?: string): string {
    if (!customFolder) return 'productos';
    const safe = customFolder
      .split('/')
      .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)
      .join('/');
    return safe || 'productos';
  }

  /**
   * Genera una URL firmada con tiempo de expiración (por defecto 7 días)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number = 60 * 60 * 24 * 7,
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        this.logger.warn(
          `No se pudo firmar URL para ${bucket}/${path}: ${error?.message}`,
        );
        // Fallback a URL pública
        const { data: pubData } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        return pubData.publicUrl;
      }

      return data.signedUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error generando signed URL: ${message}`);
      const { data: pubData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      return pubData.publicUrl;
    }
  }

  /**
   * Resuelve cualquier URL o ruta almacenada en base de datos para devolver su URL firmada válida
   */
  async resolveSignedMediaUrl(urlStorage: string): Promise<string> {
    if (!urlStorage || urlStorage.trim() === '') return '';

    // Si ya es una URL firmada de Supabase aún no expirada
    if (urlStorage.startsWith('http://') || urlStorage.startsWith('https://')) {
      // Si ya tiene token firmado
      if (urlStorage.includes('token=')) {
        return urlStorage;
      }

      // Si es una URL directa de supabase.co/storage/v1/object/public/...
      if (urlStorage.includes('.supabase.co/storage/v1/object/')) {
        const parts = urlStorage.split('/storage/v1/object/');
        if (parts[1]) {
          const cleanPart = parts[1].replace(/^(public|sign)\//, '');
          const bucket = cleanPart.startsWith('products_videos')
            ? this.videosBucket
            : this.imagesBucket;
          const path = cleanPart.replace(new RegExp(`^${bucket}/`), '');
          return this.getSignedUrl(bucket, path);
        }
      }
      return urlStorage;
    }

    // Si es un path relativo (ej: "products_videos/productos/123.mp4" o "productos/123.jpg")
    let bucket = this.imagesBucket;
    let path = urlStorage;

    if (urlStorage.startsWith('products_videos/')) {
      bucket = this.videosBucket;
      path = urlStorage.replace('products_videos/', '');
    } else if (urlStorage.startsWith('products_images/')) {
      bucket = this.imagesBucket;
      path = urlStorage.replace('products_images/', '');
    }

    return this.getSignedUrl(bucket, path);
  }

  /**
   * Elimina un archivo, restringido a los buckets propios de este sistema — nunca un bucket
   * arbitrario del proyecto Supabase (ver SEC-06 de la auditoría).
   */
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    if (bucket !== this.imagesBucket && bucket !== this.videosBucket) {
      throw new BadRequestException(
        `Bucket no permitido: solo se puede operar sobre '${this.imagesBucket}' o '${this.videosBucket}'`,
      );
    }

    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path]);
      if (error) {
        this.logger.warn(
          `Error eliminando archivo ${path} en ${bucket}: ${error.message}`,
        );
        return false;
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error al borrar archivo de Supabase: ${message}`);
      return false;
    }
  }
}
