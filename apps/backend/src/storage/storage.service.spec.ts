import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const uploadMock = jest
  .fn()
  .mockResolvedValue({ data: { path: 'productos/x.jpg' }, error: null });
const createSignedUrlMock = jest.fn().mockResolvedValue({
  data: { signedUrl: 'https://signed.example/x.jpg' },
  error: null,
});
const removeMock = jest.fn().mockResolvedValue({ error: null });
const getPublicUrlMock = jest
  .fn()
  .mockReturnValue({ data: { publicUrl: 'https://public.example/x.jpg' } });

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: uploadMock,
        createSignedUrl: createSignedUrlMock,
        remove: removeMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  }),
}));

function makeFile(
  overrides: Partial<{ mimetype: string; originalname: string }> = {},
) {
  return {
    originalname: overrides.originalname ?? 'foto.jpg',
    mimetype: overrides.mimetype ?? 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('contenido'),
  };
}

describe('StorageService', () => {
  let service: StorageService;

  const config: Record<string, string> = {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_KEY: 'service-role-key',
    SUPABASE_BUCKET_IMAGES: 'products_images',
    SUPABASE_BUCKET_VIDEOS: 'products_videos',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('uploadFile — allowlist de tipo MIME', () => {
    it('rechaza un mimetype fuera de la allowlist', async () => {
      await expect(
        service.uploadFile(makeFile({ mimetype: 'application/x-msdownload' })),
      ).rejects.toThrow(BadRequestException);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it('ignora la extensión del nombre de archivo del cliente y usa la derivada del MIME real', async () => {
      await service.uploadFile(
        makeFile({ originalname: 'foto.jpg.exe', mimetype: 'image/png' }),
      );

      const [path] = uploadMock.mock.calls[0];
      expect(path).toMatch(/\.png$/);
    });

    it('nunca sube con upsert:true (no debe sobrescribir un objeto existente)', async () => {
      await service.uploadFile(makeFile());

      const [, , options] = uploadMock.mock.calls[0];
      expect(options.upsert).toBe(false);
    });

    it('sanitiza una carpeta con intento de path traversal', async () => {
      await service.uploadFile(makeFile(), '../../etc');

      const [path] = uploadMock.mock.calls[0];
      expect(path.startsWith('etc/')).toBe(true);
      expect(path).not.toContain('..');
    });
  });

  describe('deleteFile — allowlist de bucket', () => {
    it('rechaza un bucket que no es ninguno de los dos configurados', async () => {
      await expect(
        service.deleteFile('otro-bucket-cualquiera', 'foo.jpg'),
      ).rejects.toThrow(BadRequestException);
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('permite borrar del bucket de imágenes configurado', async () => {
      const result = await service.deleteFile('products_images', 'foo.jpg');
      expect(result).toBe(true);
      expect(removeMock).toHaveBeenCalledWith(['foo.jpg']);
    });
  });
});
