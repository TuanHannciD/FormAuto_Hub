"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motionDefaults, useReducedMotion } from "./motion-presets";
import { useElementSize } from "./use-element-size";

type Entry = { key: string; content: ReactNode };

// One sequence: resize the frame, then replace its visible content.
export function TransitionRegion({ activeKey, children, duration = motionDefaults.duration, className }: {
  activeKey: string; children: ReactNode; duration?: number; className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const incoming = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const initialized = useRef(false);
  const target = useRef<{ key: string; height: number } | null>(null);
  const scrollOffset = useRef(0);
  const [current, setCurrent] = useState<Entry>({ key: activeKey, content: children });
  const [outgoing, setOutgoing] = useState<Entry | null>(null);
  const size = useElementSize(incoming);
  const reduced = useReducedMotion();

  if (current.key !== activeKey) {
    const visible = outgoing || current;
    if (!outgoing) scrollOffset.current = frame.current?.scrollTop || 0;
    setOutgoing(visible.key === activeKey ? null : visible);
    setCurrent({ key: activeKey, content: children });
  } else if (current.content !== children) {
    setCurrent({ key: activeKey, content: children });
  }

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element || !incoming.current) return;
    const previous = element.getBoundingClientRect().height;
    const next = incoming.current.getBoundingClientRect().height;
    if (reduced) { animation.current?.cancel(); animation.current = null; if (outgoing) setOutgoing(null); }
    if (target.current?.key === current.key && Math.abs(target.current.height - next) < .5) return;
    target.current = { key: current.key, height: next };
    animation.current?.cancel();
    animation.current = null;
    element.style.height = `${next}px`;
    if (outgoing) element.scrollTop = 0;
    if (!initialized.current || reduced || duration <= 0 || Math.abs(previous - next) < .5) {
      initialized.current = true;
      if (outgoing) setOutgoing(null);
      return;
    }
    const running = element.animate([{ height: `${previous}px` }, { height: `${next}px` }], { duration, easing: motionDefaults.easing });
    animation.current = running;
    running.finished.then(() => {
      if (animation.current !== running) return;
      animation.current = null;
      if (outgoing) setOutgoing(visible => visible === outgoing ? null : visible);
    }).catch(() => {});
  }, [children, current.key, outgoing, size, duration, reduced]);

  useLayoutEffect(() => () => { animation.current?.cancel(); animation.current = null; }, []);

  return (
    <div ref={frame} data-animated-size data-transition-phase={outgoing ? "resize" : "stable"} tabIndex={0} className={className}
      style={{ position: "relative", overflowX: "hidden", overflowY: outgoing ? "hidden" : "auto" }}>
      <div ref={incoming} style={{ display: "flow-root" }}>
        {outgoing && <div key={outgoing.key} data-transition-outgoing aria-hidden="true" inert
          style={{ position: "absolute", top: -scrollOffset.current, left: 0, width: "100%", pointerEvents: "none" }}>{outgoing.content}</div>}
        <div key={current.key} data-transition-current inert={!!outgoing}
          style={{ display: "flow-root", visibility: outgoing ? "hidden" : undefined }}>{children}</div>
      </div>
    </div>
  );
}
