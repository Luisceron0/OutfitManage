"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Eye,
  EyeOff,
  DollarSign,
  Boxes,
  Shirt,
  Wand2,
  CheckCircle2,
  Loader2,
  Tag,
  ArrowRight,
  Upload,
  Film,
  Image as ImageIcon,
  Star,
  Palette,
  Globe,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Categoria, Ubicacion, Producto } from "../../types/admin";
import { formatCurrency } from "../../lib/api";
import { adminApi } from "../../lib/admin-api";
import { ModalPortal } from "../ui/ModalPortal";

export interface VarianteFormItem {
  id?: string;
  skuCode: string;
  talla: string;
  color: string;
  precio: number | string;
  stockInicial?: number | string;
  stockActual?: number;
  imagenUrl?: string;
  imagenes?: string[];
  atributoOpcional?: string;
}

export interface MediaItem {
  id?: string;
  url: string;
  path?: string;
  bucket?: string;
  tipo: "IMAGE" | "VIDEO";
  color?: string; // If assigned to a specific color
  isPrimary?: boolean;
}

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    descripcion: string;
    categoriaId: string;
    visiblePublico: boolean;
    ubicacionInicialId?: string;
    imagenes: string[];
    variantes: VarianteFormItem[];
  }) => Promise<void>;
  editingProduct?: Producto | null;
  categorias: Categoria[];
  ubicaciones: Ubicacion[];
  isSubmitting?: boolean;
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38"];

const PRESET_COLORS = [
  { name: "Negro", hex: "#0a0a0a" },
  { name: "Blanco", hex: "#ffffff" },
  { name: "Azul Marino", hex: "#1e3a8a" },
  { name: "Gris", hex: "#6b7280" },
  { name: "Beige", hex: "#d4b996" },
  { name: "Verde Olivo", hex: "#3f6212" },
  { name: "Café", hex: "#78350f" },
  { name: "Rojo", hex: "#dc2626" },
  { name: "Vino", hex: "#881337" },
  { name: "Kaki", hex: "#a3907c" },
];

function generateSkuPrefix(name: string): string {
  const words = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "SKU";
  if (words.length === 1) return words[0].slice(0, 4);
  return words.map((w) => w.slice(0, 2)).join("").slice(0, 5);
}

function generateColorCode(colorName: string): string {
  return colorName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

function getColorHex(colorName: string): string {
  const match = PRESET_COLORS.find(
    (c) => c.name.toLowerCase() === colorName.toLowerCase()
  );
  return match ? match.hex : "#4b5563";
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categorias,
  ubicaciones,
  isSubmitting = false,
}: ProductFormModalProps) {
  const isEditing = Boolean(editingProduct);

  // General state (Step 1)
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [ubicacionInicialId, setUbicacionInicialId] = useState("");
  const [visiblePublico, setVisiblePublico] = useState(true);
  const [coverMedia, setCoverMedia] = useState<MediaItem | null>(null);

  // Variants & Multi-Media per Color state (Step 2)
  const [variantes, setVariantes] = useState<VarianteFormItem[]>([]);
  const [colorMediaMap, setColorMediaMap] = useState<Record<string, MediaItem[]>>({});
  const [extraMediaList, setExtraMediaList] = useState<MediaItem[]>([]);

  // Generator chips
  const [selectedPresetSizes, setSelectedPresetSizes] = useState<string[]>([]);
  const [selectedPresetColors, setSelectedPresetColors] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [bulkStock, setBulkStock] = useState<string>("");

  // UI state
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null); // "cover" | colorName
  const [formError, setFormError] = useState<string | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number>(0);

  // Unified 2 Steps: "general" | "variantes"
  const [activeTab, setActiveTab] = useState<"general" | "variantes">("general");

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (editingProduct) {
      setNombre(editingProduct.nombre);
      setDescripcion(editingProduct.descripcion || "");
      setCategoriaId(editingProduct.categoriaId);
      setVisiblePublico(editingProduct.visiblePublico);

      const allMedia: MediaItem[] = (editingProduct.imagenes || []).map((img: any, idx: number) => ({
        id: img.id,
        url: img.urlStorage,
        path: img.urlStorage,
        tipo: img.tipo === "VIDEO" || img.urlStorage?.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE",
        isPrimary: idx === 0,
      }));

      if (allMedia.length > 0) {
        setCoverMedia(allMedia[0]);
        setExtraMediaList(allMedia.slice(1));
      } else {
        setCoverMedia(null);
        setExtraMediaList([]);
      }

      // Populate multi-media per color
      const initialColorMedia: Record<string, MediaItem[]> = {};

      (editingProduct.variantes || []).forEach((v) => {
        if (!initialColorMedia[v.color]) {
          initialColorMedia[v.color] = [];
        }

        if (v.imagenes && v.imagenes.length > 0) {
          v.imagenes.forEach((img: any) => {
            if (!initialColorMedia[v.color].some((m) => m.url === img.urlStorage)) {
              initialColorMedia[v.color].push({
                id: img.id,
                url: img.urlStorage,
                path: img.urlStorage,
                tipo: img.tipo === "VIDEO" || img.urlStorage?.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE",
                color: v.color,
              });
            }
          });
        } else if (v.imagenUrl) {
          if (!initialColorMedia[v.color].some((m) => m.url === v.imagenUrl)) {
            initialColorMedia[v.color].push({
              url: v.imagenUrl,
              path: v.imagenUrl,
              tipo: v.imagenUrl.match(/\.(mp4|webm|mov)$/i) ? "VIDEO" : "IMAGE",
              color: v.color,
            });
          }
        }
      });

      const mapped = (editingProduct.variantes || []).map((v) => {
        const activePrice = v.precios?.[0]?.precio ? Number(v.precios[0].precio) : "";
        const totalStock = (v.saldos || []).reduce((sum, s) => sum + s.cantidad, 0);
        const colorMediaUrls = (initialColorMedia[v.color] || []).map((m) => m.url);

        return {
          id: v.id,
          skuCode: v.skuCode,
          talla: v.talla,
          color: v.color,
          precio: activePrice,
          stockActual: totalStock,
          imagenUrl: v.imagenUrl || colorMediaUrls[0] || undefined,
          imagenes: colorMediaUrls.length > 0 ? colorMediaUrls : undefined,
          atributoOpcional: v.atributoOpcional || undefined,
        };
      });

      setColorMediaMap(initialColorMedia);
      setVariantes(
        mapped.length > 0
          ? mapped
          : [{ skuCode: "", talla: "M", color: "Negro", precio: "" }]
      );
      setActiveTab("general");
    } else {
      // Reset for new product
      setNombre("");
      setDescripcion("");
      setCategoriaId(categorias[0]?.id || "");
      setUbicacionInicialId(ubicaciones[0]?.id || "");
      setVisiblePublico(true);
      setCoverMedia(null);
      setColorMediaMap({});
      setExtraMediaList([]);
      setVariantes([
        { skuCode: "", talla: "M", color: "Negro", precio: "", stockInicial: "10" },
      ]);
      setSelectedPresetSizes([]);
      setSelectedPresetColors([]);
      setBulkPrice("");
      setBulkStock("");
      setActiveTab("general");
    }
    setFormError(null);
    setPreviewMediaIndex(0);
  }, [editingProduct, isOpen, categorias, ubicaciones]);

  if (!isOpen) return null;

  // Handle upload for Cover Image
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget("cover");
    setFormError(null);

    try {
      const res = await adminApi.uploadMedia(file, "productos");
      setCoverMedia({
        url: res.signedUrl,
        path: res.path,
        bucket: res.bucket,
        tipo: res.tipo,
        isPrimary: true,
      });
    } catch (err: any) {
      setFormError(err.message || "Error al subir foto de portada a Supabase.");
    } finally {
      setUploadingTarget(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // Handle multi-upload for a specific Color
  const handleUploadForColor = async (colorName: string, files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingTarget(colorName);
    setFormError(null);

    try {
      const uploadedMedia: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await adminApi.uploadMedia(file, "productos");
        uploadedMedia.push({
          url: res.signedUrl,
          path: res.path,
          bucket: res.bucket,
          tipo: res.tipo,
          color: colorName,
        });
      }

      const updatedListForColor = [...(colorMediaMap[colorName] || []), ...uploadedMedia];

      setColorMediaMap((prev) => ({
        ...prev,
        [colorName]: updatedListForColor,
      }));

      // Propagate all image paths/URLs to variants of this color
      const allUrls = updatedListForColor.map((m) => m.path || m.url);
      setVariantes((prev) =>
        prev.map((v) =>
          v.color.toLowerCase() === colorName.toLowerCase()
            ? {
                ...v,
                imagenUrl: allUrls[0],
                imagenes: allUrls,
              }
            : v
        )
      );

      // If no cover media yet, set first uploaded as cover
      if (!coverMedia && uploadedMedia.length > 0) {
        setCoverMedia({ ...uploadedMedia[0], isPrimary: true });
      }
    } catch (err: any) {
      setFormError(err.message || `Error subiendo fotos para el color ${colorName}.`);
    } finally {
      setUploadingTarget(null);
      if (colorInputRefs.current[colorName]) {
        colorInputRefs.current[colorName]!.value = "";
      }
    }
  };

  // Remove a specific media item from a color
  const handleRemoveMediaFromColor = (colorName: string, mediaIndex: number) => {
    const currentList = colorMediaMap[colorName] || [];
    const updatedList = currentList.filter((_, idx) => idx !== mediaIndex);

    setColorMediaMap((prev) => ({
      ...prev,
      [colorName]: updatedList,
    }));

    const allUrls = updatedList.map((m) => m.path || m.url);
    setVariantes((prev) =>
      prev.map((v) =>
        v.color.toLowerCase() === colorName.toLowerCase()
          ? {
              ...v,
              imagenUrl: allUrls[0] || undefined,
              imagenes: allUrls.length > 0 ? allUrls : undefined,
            }
          : v
      )
    );
  };

  // Toggle size chip
  const handleToggleSize = (size: string) => {
    setSelectedPresetSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Toggle color chip
  const handleToggleColor = (color: string) => {
    setSelectedPresetColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  // Auto-generate combinations
  const handleGenerateCombinations = () => {
    if (selectedPresetSizes.length === 0 || selectedPresetColors.length === 0) {
      setFormError("Selecciona al menos 1 talla y 1 color para generar combinaciones.");
      return;
    }

    const prefix = generateSkuPrefix(nombre);
    const newVariantes: VarianteFormItem[] = [];

    selectedPresetColors.forEach((color) => {
      const colorCode = generateColorCode(color);
      const existingMediaForColor = colorMediaMap[color] || [];
      const mediaUrls = existingMediaForColor.map((m) => m.path || m.url);

      selectedPresetSizes.forEach((size) => {
        const sizeCode = size.toUpperCase().replace(/\s+/g, "");
        const sku = `${prefix}-${colorCode}-${sizeCode}`;

        newVariantes.push({
          skuCode: sku,
          talla: size,
          color: color,
          imagenUrl: mediaUrls[0] || coverMedia?.url,
          imagenes: mediaUrls.length > 0 ? mediaUrls : undefined,
          precio: bulkPrice !== "" ? Number(bulkPrice) : 89000,
          stockInicial: bulkStock !== "" ? Number(bulkStock) : 10,
        });
      });
    });

    setVariantes(newVariantes);
    setFormError(null);
  };

  // Manual row updates
  const handleVarianteChange = (index: number, field: keyof VarianteFormItem, value: any) => {
    const updated = [...variantes];
    updated[index] = { ...updated[index], [field]: value };
    setVariantes(updated);
  };

  const handleAddManualRow = () => {
    const prefix = generateSkuPrefix(nombre);
    const index = variantes.length + 1;
    const defaultColor = distinctColors[0] || "Negro";
    const existingMedia = (colorMediaMap[defaultColor] || []).map((m) => m.path || m.url);

    setVariantes([
      ...variantes,
      {
        skuCode: `${prefix}-VAR-${index}`,
        talla: "M",
        color: defaultColor,
        precio: bulkPrice ? Number(bulkPrice) : 89000,
        stockInicial: bulkStock ? Number(bulkStock) : 10,
        imagenUrl: existingMedia[0] || coverMedia?.url,
        imagenes: existingMedia.length > 0 ? existingMedia : undefined,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (variantes.length <= 1) return;
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError("El nombre de la prenda es obligatorio.");
      setActiveTab("general");
      return;
    }

    if (!categoriaId) {
      setFormError("Debes seleccionar una categoría.");
      setActiveTab("general");
      return;
    }

    const skusIncompletos = variantes.some(
      (v) => !v.skuCode.trim() || !v.talla.trim() || !v.color.trim()
    );
    if (skusIncompletos) {
      setFormError("Cada variante debe tener un código SKU, talla y color válidos.");
      setActiveTab("variantes");
      return;
    }

    // Collect all general media paths
    const allMediaPaths: string[] = [];
    if (coverMedia?.path || coverMedia?.url) {
      allMediaPaths.push(coverMedia.path || coverMedia.url);
    }

    extraMediaList.forEach((m) => {
      const p = m.path || m.url;
      if (p && !allMediaPaths.includes(p)) {
        allMediaPaths.push(p);
      }
    });

    // Prepare each variant with its full array of image paths
    const finalVariantes = variantes.map((v) => {
      const colorMedia = colorMediaMap[v.color] || [];
      const varMediaPaths = colorMedia.map((m) => m.path || m.url);

      return {
        id: v.id,
        skuCode: v.skuCode,
        talla: v.talla,
        color: v.color,
        precio: Number(v.precio) || 0,
        stockInicial: v.stockInicial,
        imagenUrl: varMediaPaths[0] || v.imagenUrl,
        imagenes: varMediaPaths.length > 0 ? varMediaPaths : v.imagenUrl ? [v.imagenUrl] : [],
        atributoOpcional: v.atributoOpcional,
      };
    });

    try {
      await onSubmit({
        nombre,
        descripcion,
        categoriaId,
        visiblePublico,
        ubicacionInicialId: !isEditing ? ubicacionInicialId : undefined,
        imagenes: allMediaPaths,
        variantes: finalVariantes,
      });
    } catch (err: any) {
      setFormError(err.message || "Error al guardar el producto.");
    }
  };

  // Distinct colors in current variants
  const distinctColors = Array.from(
    new Set(variantes.map((v) => v.color).filter(Boolean))
  );

  // Preview computations
  const selectedCategoryObj = categorias.find((c) => c.id === categoriaId);
  const lowestPrice =
    variantes.length > 0
      ? Math.min(...variantes.map((v) => Number(v.precio) || 0).filter((p) => p > 0))
      : 89000;
  const uniqueSizes = Array.from(
    new Set(variantes.map((v) => v.talla).filter(Boolean))
  );
  const totalStockCount = variantes.reduce(
    (sum, v) => sum + (Number(isEditing ? v.stockActual : v.stockInicial) || 0),
    0
  );

  // Current media gallery for the active preview color
  const activeColorMediaGallery: MediaItem[] =
    (previewColor && colorMediaMap[previewColor] && colorMediaMap[previewColor].length > 0
      ? colorMediaMap[previewColor]
      : null) ||
    (coverMedia ? [coverMedia] : []);

  const activePreviewMedia = activeColorMediaGallery[previewMediaIndex] || activeColorMediaGallery[0] || coverMedia;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{isEditing ? "Editar Prenda & Variantes" : "Registrar Nueva Prenda"}</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Galería Multi-Fotos
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura los datos generales, genera tallas y asigna múltiples fotos/videos por cada color.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
            <span>{formError}</span>
            <button
              onClick={() => setFormError(null)}
              className="text-rose-500 hover:underline text-xs"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Body Split Grid: Left Form (7 cols) + Right Live Preview (5 cols) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
          {/* Left Column: Form & Tabs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 2-Step Tabs Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "general"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>1. Información &amp; Portada</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("variantes")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "variantes"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Wand2 className="w-4 h-4 text-amber-500" />
                <span>2. Variantes &amp; Fotos por Color ({variantes.length})</span>
              </button>
            </div>

            {/* TAB 1: General Info & Cover Media */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nombre de la Prenda *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Camiseta Polo Slim Fit Pima"
                    className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 dark:text-white font-semibold transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Categoría *
                    </label>
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isEditing && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Sede de Stock Inicial *
                      </label>
                      <select
                        value={ubicacionInicialId}
                        onChange={(e) => setUbicacionInicialId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                      >
                        {ubicaciones.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre} ({u.tipo})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Cover Image Upload Card */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Foto / Video de Portada General</span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      Visible en la vitrina principal
                    </span>
                  </label>

                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleUploadCover}
                      className="hidden"
                    />

                    {coverMedia ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black shrink-0 border border-indigo-500/40">
                        {coverMedia.tipo === "VIDEO" ? (
                          <video
                            src={coverMedia.url}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverMedia.url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/80 text-[8px] font-mono text-white">
                          {coverMedia.tipo}
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-dashed border-indigo-500/30 flex flex-col items-center justify-center text-indigo-500 shrink-0">
                        <Camera className="w-6 h-6 opacity-60" />
                        <span className="text-[9px] font-mono mt-1">Sin portada</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {coverMedia ? "Portada Cargada" : "Sube la foto principal"}
                        </p>
                        {coverMedia && (
                          <button
                            type="button"
                            onClick={() => setCoverMedia(null)}
                            className="text-[11px] font-mono text-rose-500 hover:underline"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Se muestra si el cliente no ha seleccionado un color específico.
                      </p>

                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingTarget === "cover"}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      >
                        {uploadingTarget === "cover" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{coverMedia ? "Cambiar Portada" : "Subir Portada"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Descripción / Detalles de la Tela
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    placeholder="Detalles sobre gramaje, horma, composición de algodón, cuidados de lavado..."
                    className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Mostrar en Catálogo Virtual Público
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Si está activo, los clientes podrán ver y pedir esta prenda desde la web.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVisiblePublico(!visiblePublico)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      visiblePublico ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        visiblePublico ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("variantes")}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <span>Configurar Variantes &amp; Fotos por Color</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Unified Variants & Multi-Media per Color */}
            {activeTab === "variantes" && (
              <div className="space-y-6 animate-fadeIn">
                {/* 1. Asistente Rápido de Combinaciones */}
                <div className="p-5 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        1. Generador Automático de Variantes
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-500 font-bold">
                      Tallas × Colores = SKUs
                    </span>
                  </div>

                  {/* Size Chips */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block font-semibold">
                      Selecciona las Tallas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SIZES.map((size) => {
                        const isSelected = selectedPresetSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Chips */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block font-semibold">
                      Selecciona los Colores:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((col) => {
                        const isSelected = selectedPresetColors.includes(col.name);
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => handleToggleColor(col.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bulk Price & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/15">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                        Precio Base ($ COP)
                      </span>
                      <input
                        type="number"
                        placeholder="Ej: 89900"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 outline-none text-slate-900 dark:text-white"
                      />
                    </div>

                    {!isEditing && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                          Stock Inicial por Variante
                        </span>
                        <input
                          type="number"
                          placeholder="Ej: 10"
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleGenerateCombinations}
                        disabled={
                          selectedPresetSizes.length === 0 || selectedPresetColors.length === 0
                        }
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-40"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>
                          Generar ({selectedPresetSizes.length * selectedPresetColors.length})
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Múltiples Fotos & Videos por Color Asignado */}
                {distinctColors.length > 0 && (
                  <div className="space-y-3 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          2. Galerías Multimedia por Color ({distinctColors.length})
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-500 font-bold">
                        Permite varias fotos por color
                      </span>
                    </div>

                    <div className="space-y-3">
                      {distinctColors.map((colorName) => {
                        const mediaItems = colorMediaMap[colorName] || [];
                        const isUploadingThisColor = uploadingTarget === colorName;

                        return (
                          <div
                            key={colorName}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm"
                          >
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              ref={(el) => {
                                colorInputRefs.current[colorName] = el;
                              }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUploadForColor(colorName, e.target.files);
                                }
                              }}
                              className="hidden"
                            />

                            {/* Header of color card */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                  style={{ backgroundColor: getColorHex(colorName) }}
                                />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {colorName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  ({mediaItems.length} {mediaItems.length === 1 ? "archivo" : "archivos"})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => colorInputRefs.current[colorName]?.click()}
                                disabled={isUploadingThisColor}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                              >
                                {isUploadingThisColor ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                <span>{mediaItems.length === 0 ? "Subir Fotos" : "Añadir Más"}</span>
                              </button>
                            </div>

                            {/* Media Gallery Thumbnails */}
                            {mediaItems.length === 0 ? (
                              <div
                                onClick={() => colorInputRefs.current[colorName]?.click()}
                                className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-slate-400 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all"
                              >
                                <Upload className="w-4 h-4 opacity-60" />
                                <span>Haz clic para subir fotos o video para {colorName}</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2.5 pt-1">
                                {mediaItems.map((media, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 group shadow-sm shrink-0"
                                  >
                                    {media.tipo === "VIDEO" ? (
                                      <video
                                        src={media.url}
                                        muted
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={media.url}
                                        alt={`${colorName} ${mIdx}`}
                                        className="w-full h-full object-cover"
                                      />
                                    )}

                                    {mIdx === 0 && (
                                      <span className="absolute top-1 left-1 px-1 rounded bg-indigo-600 text-[8px] font-mono text-white">
                                        Principal
                                      </span>
                                    )}

                                    {/* Delete Button on hover */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMediaFromColor(colorName, mIdx)}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-rose-400 hover:text-rose-300"
                                      title="Eliminar foto"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Matriz de Variantes & SKUs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          3. Matriz de SKUs ({variantes.length})
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Edita individualmente el SKU, talla, color o precio de cada pieza.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddManualRow}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Fila Manual</span>
                    </button>
                  </div>

                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 pt-1">
                    <div className="col-span-4">Código SKU *</div>
                    <div className="col-span-2">Talla *</div>
                    <div className="col-span-2">Color *</div>
                    <div className="col-span-3">Precio ($) *</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {variantes.map((v, idx) => {
                      const colorMedias = colorMediaMap[v.color] || [];
                      const activeImg = v.imagenUrl || colorMedias[0]?.url || coverMedia?.url;

                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="col-span-4 flex items-center gap-2">
                            {/* Small media preview or color dot */}
                            {activeImg ? (
                              <div
                                onClick={() => {
                                  setPreviewColor(v.color);
                                  setPreviewMediaIndex(0);
                                }}
                                className="w-6 h-6 rounded-md overflow-hidden bg-black shrink-0 border border-indigo-500/30 cursor-pointer"
                                title="Clic para previsualizar"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={activeImg} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: getColorHex(v.color) }}
                              />
                            )}

                            <input
                              type="text"
                              required
                              placeholder="POLO-AZU-M"
                              value={v.skuCode}
                              onChange={(e) =>
                                handleVarianteChange(idx, "skuCode", e.target.value.toUpperCase())
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 uppercase"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="text"
                              required
                              placeholder="M"
                              value={v.talla}
                              onChange={(e) => handleVarianteChange(idx, "talla", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="text"
                              required
                              placeholder="Negro"
                              value={v.color}
                              onChange={(e) => handleVarianteChange(idx, "color", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              required
                              min={0}
                              placeholder="89000"
                              value={v.precio}
                              onChange={(e) => handleVarianteChange(idx, "precio", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              disabled={variantes.length <= 1}
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 disabled:opacity-20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Storefront Card Preview with Multi-Photo Gallery (5 cols) */}
          <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vista Previa Interactiva</span>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    visiblePublico
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {visiblePublico ? "Visible en Web" : "Oculto"}
                </span>
              </div>

              {/* Mock Product Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 shadow-xl space-y-4 relative overflow-hidden">
                <div className="aspect-[4/3] rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                  {activePreviewMedia ? (
                    activePreviewMedia.tipo === "VIDEO" ? (
                      <video
                        src={activePreviewMedia.url}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activePreviewMedia.url}
                        alt="Preview"
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-500">
                      <ShoppingBag className="w-10 h-10 text-indigo-400 opacity-60 mb-2" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        {selectedCategoryObj?.nombre || "Atelier"}
                      </span>
                    </div>
                  )}

                  {/* Price Tag Overlay */}
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-mono font-bold shadow-lg">
                    {formatCurrency(lowestPrice)}
                  </span>

                  {/* Active Variant Tag Overlay */}
                  {previewColor && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                      Color: {previewColor} ({previewMediaIndex + 1}/{activeColorMediaGallery.length || 1})
                    </span>
                  )}

                  {/* Mini navigation arrows if multiple images for this color */}
                  {activeColorMediaGallery.length > 1 && (
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMediaIndex((prev) =>
                            prev === 0 ? activeColorMediaGallery.length - 1 : prev - 1
                          );
                        }}
                        className="w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center pointer-events-auto hover:bg-white hover:text-black transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMediaIndex((prev) =>
                            (prev + 1) % activeColorMediaGallery.length
                          );
                        }}
                        className="w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center pointer-events-auto hover:bg-white hover:text-black transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails strip for active color */}
                {activeColorMediaGallery.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {activeColorMediaGallery.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewMediaIndex(idx)}
                        className={`relative w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border transition-all ${
                          previewMediaIndex === idx
                            ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-105"
                            : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                    {nombre || "Nombre de la Prenda..."}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {descripcion || "Descripción de la prenda, tejidos y recomendaciones..."}
                  </p>
                </div>

                {/* Interactive Color Switcher Chips */}
                {distinctColors.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Selecciona un color para ver su galería:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {distinctColors.map((color) => {
                        const isSelected = previewColor === color;
                        const mediaCount = (colorMediaMap[color] || []).length;

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setPreviewColor(isSelected ? null : color);
                              setPreviewMediaIndex(0);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-sm scale-105"
                                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 hover:bg-white/20"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full border border-white/20"
                              style={{ backgroundColor: getColorHex(color) }}
                            />
                            <span>{color}</span>
                            {mediaCount > 1 && (
                              <span className="text-[9px] opacity-75">({mediaCount})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes Pills */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400">Tallas:</span>
                    {uniqueSizes.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200"
                      >
                        {s}
                      </span>
                    ))}
                    {uniqueSizes.length > 4 && (
                      <span className="text-[10px] text-zinc-400">+{uniqueSizes.length - 4}</span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-emerald-500 font-bold">
                    {totalStockCount > 0 ? `${totalStockCount} u. stock` : "Sin stock"}
                  </span>
                </div>
              </div>

              {/* Summary Stats Box */}
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Colores Configurados:</span>
                  <strong className="text-slate-900 dark:text-white">{distinctColors.length}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Fotos por Color:</span>
                  <strong className="text-indigo-400">
                    {Object.values(colorMediaMap).reduce((sum, list) => sum + list.length, 0)} fotos totales
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Variantes (SKUs):</span>
                  <strong className="text-slate-900 dark:text-white">{variantes.length}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Stock Total Inicial:</span>
                  <strong className="text-emerald-500">{totalStockCount} unidades</strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={isSubmitting || Boolean(uploadingTarget)}
                className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditing ? "Guardar Cambios" : "Crear Prenda"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </ModalPortal>
  );
}

export default ProductFormModal;
