"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type ElementSize = { width: number; height: number };

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<ElementSize | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      setSize(previous => previous && Math.abs(previous.width - next.width) < 0.5 && Math.abs(previous.height - next.height) < 0.5 ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
