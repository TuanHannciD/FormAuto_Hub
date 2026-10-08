"use client";

import { useEffect, useState } from "react";

export const motionDefaults = { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
