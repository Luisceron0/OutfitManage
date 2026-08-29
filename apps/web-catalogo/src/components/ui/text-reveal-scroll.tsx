"use client";

import React, { useEffect, useRef, useState } from "react";

export interface TextRevealScrollProps {
  children?: React.ReactNode;
  text?: string;
  revealMode?: "chars" | "words";
  startOffset?: number;
  endOffset?: number;
  dimOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TextRevealScroll({
  children,
  text,
  revealMode = "words",
  startOffset = 85,
  endOffset = 25,
  dimOpacity = 0.2,
  className = "",
  style,
}: TextRevealScrollProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<HTMLElement[]>([]);
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number>(0);

  const startOffsetRef = useRef(startOffset);
  const endOffsetRef = useRef(endOffset);
  const dimOpacityRef = useRef(dimOpacity);

  startOffsetRef.current = startOffset;
  endOffsetRef.current = endOffset;
  dimOpacityRef.current = dimOpacity;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !rootRef.current || !textRef.current) return;

    const root = rootRef.current;
    const textRoot = textRef.current;
    const allSegments: HTMLElement[] = [];

    // Helper to process text nodes into character/word spans
    const processNodes = (el: Node) => {
      const originalChildren = Array.from(el.childNodes);
      for (const node of originalChildren) {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent || "";
          if (!content.length) continue;

          const frag = document.createDocumentFragment();

          if (revealMode === "chars") {
            for (const char of content) {
              if (char === " ") {
                frag.appendChild(document.createTextNode(" "));
              } else {
                const span = document.createElement("span");
                span.textContent = char;
                span.style.display = "inline";
                span.style.opacity = String(dimOpacityRef.current);
                span.style.willChange = "opacity";
                span.style.transition = "opacity 0.05s linear";
                frag.appendChild(span);
                allSegments.push(span);
              }
            }
          } else {
            const parts = content.split(/(\s+)/);
            for (const part of parts) {
              if (!part) continue;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else {
                const span = document.createElement("span");
                span.textContent = part;
                span.style.display = "inline-block";
                span.style.opacity = String(dimOpacityRef.current);
                span.style.willChange = "opacity";
                span.style.transition = "opacity 0.08s linear";
                frag.appendChild(span);
                allSegments.push(span);
              }
            }
          }

          node.parentNode?.replaceChild(frag, node);
          continue;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const childEl = node as HTMLElement;
          if (childEl.tagName === "BR") {
            childEl.style.display = "inline";
            allSegments.push(childEl);
            continue;
          }
          processNodes(childEl);
        }
      }
    };

    textRoot.style.visibility = "hidden";
    processNodes(textRoot);

    if (allSegments.length === 0) {
      textRoot.style.visibility = "visible";
      return;
    }

    segmentsRef.current = allSegments;
    textRoot.style.visibility = "visible";

    const computeReveal = () => {
      if (!isVisibleRef.current || !rootRef.current) return;

      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const startPx = vh * (startOffsetRef.current / 100);
      const endPx = vh * (endOffsetRef.current / 100);
      const totalRange = rect.height + (startPx - endPx);
      const scrolled = startPx - rect.top;
      const progress = Math.min(Math.max(scrolled / totalRange, 0), 1);

      const total = segmentsRef.current.length;
      const litCount = Math.floor(progress * total);

      segmentsRef.current.forEach((seg, i) => {
        if (i < litCount) {
          seg.style.opacity = "1";
        } else if (i === litCount) {
          const frac = progress * total - litCount;
          seg.style.opacity = String(
            dimOpacityRef.current + frac * (1 - dimOpacityRef.current)
          );
        } else {
          seg.style.opacity = String(dimOpacityRef.current);
        }
      });
    };

    const scheduleReveal = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(computeReveal);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0].isIntersecting;
        if (isVisibleRef.current) scheduleReveal();
      },
      { rootMargin: "200px 0px 200px 0px", threshold: 0 }
    );

    intersectionObserver.observe(root);
    window.addEventListener("scroll", scheduleReveal, { passive: true });
    window.addEventListener("resize", scheduleReveal, { passive: true });

    scheduleReveal();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", scheduleReveal);
      window.removeEventListener("resize", scheduleReveal);
      intersectionObserver.disconnect();
      segmentsRef.current = [];
    };
  }, [isClient, revealMode, text]);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`} style={style}>
      <div ref={textRef} className="w-full">
        {text ? text : children}
      </div>
    </div>
  );
}

export default TextRevealScroll;
