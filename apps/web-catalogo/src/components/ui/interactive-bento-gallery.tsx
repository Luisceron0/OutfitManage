"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&fit=crop";

export interface MediaItemType {
  id: number | string;
  type: string;
  title: string;
  desc: string;
  url: string;
  span: string;
  link?: string;
  price?: number | null;
}

const MediaItem = ({
  item,
  className,
  onClick,
}: {
  item: MediaItemType;
  className?: string;
  onClick?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [imgSrc, setImgSrc] = useState(item.url || FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(item.url || FALLBACK_IMAGE);
  }, [item.url]);

  useEffect(() => {
    if (item.type !== "video") return;
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsInView(entry.isIntersecting);
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [item.type]);

  useEffect(() => {
    if (item.type !== "video") return;
    let mounted = true;

    const handleVideoPlay = async () => {
      if (!videoRef.current || !isInView || !mounted) return;

      try {
        if (videoRef.current.readyState >= 3) {
          setIsBuffering(false);
          await videoRef.current.play();
        } else {
          setIsBuffering(true);
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.oncanplay = resolve;
            }
          });
          if (mounted) {
            setIsBuffering(false);
            await videoRef.current.play();
          }
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
      }
    };

    if (isInView) {
      handleVideoPlay();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }

    return () => {
      mounted = false;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, [isInView, item.type]);

  if (item.type === "video") {
    return (
      <div className={`${className} relative overflow-hidden`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onClick={onClick}
          playsInline
          muted
          loop
          preload="auto"
          style={{
            opacity: isBuffering ? 0.8 : 1,
            transition: "opacity 0.2s",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={item.title}
      className={`${className} object-cover cursor-pointer transition-transform duration-700 ease-out`}
      onClick={onClick}
      onError={() => setImgSrc(FALLBACK_IMAGE)}
      loading="lazy"
      decoding="async"
    />
  );
};

interface GalleryModalProps {
  selectedItem: MediaItemType;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[];
}

const GalleryModal = ({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  mediaItems,
}: GalleryModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-950 flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 z-20 backdrop-blur-md transition-transform active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media Area */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[55vh] bg-black/90 overflow-hidden">
            <MediaItem
              item={selectedItem}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Details & CTA Footer */}
          <div className="p-5 sm:p-8 bg-zinc-950 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {selectedItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {selectedItem.desc}
              </p>
            </div>

            {selectedItem.link && (
              <Link
                href={selectedItem.link}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg active:scale-95"
              >
                <span>Ver Prenda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Quick thumbnail navigation */}
          <div className="px-5 pb-5 sm:px-8 sm:pb-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border transition-all ${
                  selectedItem.id === item.id
                    ? "border-indigo-500 scale-105 ring-2 ring-indigo-500/50"
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                <MediaItem item={item} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export interface InteractiveBentoGalleryProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
}

export const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({
  mediaItems,
  title,
  description,
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10 text-center">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black bg-clip-text text-transparent 
                     bg-gradient-to-r from-white via-slate-200 to-white tracking-tight"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mt-2.5 text-xs sm:text-sm md:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <GalleryModal
            selectedItem={selectedItem}
            isOpen={true}
            onClose={() => setSelectedItem(null)}
            setSelectedItem={setSelectedItem}
            mediaItems={mediaItems}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-[160px] sm:auto-rows-[170px] md:auto-rows-[190px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
          >
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                className={`group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10 bg-zinc-950 shadow-xl ${item.span}`}
                onClick={() => setSelectedItem(item)}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                      delay: index * 0.03,
                    },
                  },
                }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <MediaItem
                  item={item}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105"
                  onClick={() => setSelectedItem(item)}
                />

                {/* Permanent subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                {/* Card Information */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 pointer-events-none">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white text-sm sm:text-base font-black tracking-tight line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <span className="p-1.5 rounded-full bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveBentoGallery;
