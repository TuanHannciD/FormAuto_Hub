"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { motionDefaults } from "./motion-presets";

// Open: grow the empty frame, then reveal content. Close: hide, then shrink.
export function usePopupMotion(frame: RefObject<HTMLElement | null>, content: RefObject<HTMLElement | null>, onClosed: () => void) {
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("opening");
  const currentPhase = useRef(phase);
  const animation = useRef<Animation | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const closed = useRef(onClosed);
  closed.current = onClosed;

  const open = useCallback(() => {
    const element = frame.current;
    const body = content.current;
    if (!element || !body) return;
    const from = currentPhase.current === "closing" ? element.getBoundingClientRect().height : 0;
    currentPhase.current = "opening";
    setPhase("opening");
    animation.current?.cancel();
    animation.current = null;
    observer.current?.disconnect();
    element.style.height = `${from}px`;
    const finish = () => {
      if (currentPhase.current !== "opening") return;
      currentPhase.current = "open";
      observer.current?.disconnect();
      animation.current = null;
      element.style.height = "";
      setPhase("open");
    };
    const resize = () => {
      if (currentPhase.current !== "opening") return;
      const from = element.getBoundingClientRect().height;
      const style = getComputedStyle(element);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const height = Math.min(body.getBoundingClientRect().height + border, parseFloat(style.maxHeight) || Infinity);
      // An unchanged observation must not restart the running opening animation.
      if (animation.current && element.style.height === `${height}px`) return;
      animation.current?.cancel();
      animation.current = null;
      element.style.height = `${height}px`;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(from - height) < .5) { finish(); return; }
      const running = element.animate([{ height: `${from}px` }, { height: `${height}px` }], motionDefaults);
      animation.current = running;
      running.finished.then(() => { if (animation.current === running) finish(); }).catch(() => {});
    };
    observer.current = new ResizeObserver(resize);
    observer.current.observe(body);
    resize();
  }, [frame, content]);

  const close = useCallback(() => {
    if (currentPhase.current === "closing") return;
    currentPhase.current = "closing";
    setPhase("closing");
    observer.current?.disconnect();
    const element = frame.current;
    if (!element) { closed.current(); return; }
    const height = element.getBoundingClientRect().height;
    animation.current?.cancel();
    animation.current = null;
    element.style.height = "0px";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { closed.current(); return; }
    const running = element.animate([{ height: `${height}px` }, { height: "0px" }], motionDefaults);
    animation.current = running;
    running.finished.then(() => { if (animation.current === running) closed.current(); }).catch(() => {});
  }, [frame]);

  useEffect(() => () => { observer.current?.disconnect(); animation.current?.cancel(); animation.current = null; }, []);
  return { phase, open, close };
}
