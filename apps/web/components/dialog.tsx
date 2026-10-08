"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonStyles, panelStyles, type ButtonSize, type ButtonVariant } from "./ui-styles";
import { usePopupMotion } from "./motion/use-popup-motion";

type DialogProps = { open: boolean; onOpenChange?: (open: boolean) => void; children?: ReactNode; className?: string };
type DialogState = ReturnType<typeof usePopupMotion> & {
  frame: React.RefObject<HTMLDivElement | null>;
  content: React.RefObject<HTMLDivElement | null>;
  titleId: string;
};
const DialogContext = createContext<DialogState | null>(null);

export function useDialogPhase() { return useContext(DialogContext)?.phase ?? "open"; }

// Keep the modal mounted until its closing animation finishes, even when open becomes false.
export function Dialog(props: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const [present, setPresent] = useState(props.open);
  const content = useRef(props.children);
  if (props.open) content.current = props.children;
  useEffect(() => { setMounted(true); }, []);
  useLayoutEffect(() => { if (props.open) setPresent(true); }, [props.open]);
  if (!mounted || !present) return null;
  return <MountedDialog {...props} onClosed={() => { setPresent(false); if (props.open) props.onOpenChange?.(false); }}>{content.current}</MountedDialog>;
}

function MountedDialog({ open: requestedOpen, children, className, onClosed }: DialogProps & { onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const motion = usePopupMotion(frame, content, onClosed);
  const { open, close } = motion;

  useLayoutEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    open();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!requestedOpen) close();
    else if (dialog.current?.dataset.popupPhase === "closing") open();
  }, [requestedOpen, close, open]);
  useEffect(() => {
    if (motion.phase === "open") content.current?.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']")?.focus();
  }, [motion.phase]);

  return createPortal(
    <DialogContext.Provider value={{ ...motion, frame, content, titleId }}>
      <dialog ref={dialog} aria-labelledby={titleId} data-popup-phase={motion.phase}
        onCancel={event => { event.preventDefault(); motion.close(); }}
        onClick={event => { if (event.target === event.currentTarget) motion.close(); }}
        onKeyDown={event => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], iframe, [tabindex='0']"))
            .filter(element => element.getClientRects().length > 0 && !element.closest("[inert]"));
          const index = controls.indexOf(document.activeElement as HTMLElement);
          if (!controls.length) { event.preventDefault(); event.currentTarget.focus(); }
          else if (event.shiftKey && index <= 0) { event.preventDefault(); controls[controls.length - 1].focus(); }
          else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
        }}
        className={cn("m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-visible border-0 bg-transparent p-0 text-foreground backdrop:bg-overlay/50", className)}>
        {children}
      </dialog>
    </DialogContext.Provider>, document.body
  );
}

export function DialogContent({ className, children, contentClassName, style, ...props }: ComponentProps<"div"> & { contentClassName?: string }) {
  const state = useContext(DialogContext);
  if (!state) throw new Error("DialogContent must be used inside Dialog.");
  return <div {...props} ref={state.frame} data-popup-frame className={cn(panelStyles, "relative z-10 max-h-[calc(100dvh-2rem)] w-full overflow-y-auto", className)}
    style={{ ...style, ...(state.phase !== "open" ? { overflow: "hidden" } : {}) }}>
    <div ref={state.content} data-popup-content inert={state.phase !== "open"} className={cn("flow-root", contentClassName)} style={{ visibility: state.phase === "open" ? undefined : "hidden" }}>
      {children}
    </div>
  </div>;
}

export function DialogTitle({ className, id, ...props }: ComponentProps<"h2">) {
  const state = useContext(DialogContext);
  return <h2 id={id ?? state?.titleId} className={cn("text-lg font-semibold", className)} {...props} />;
}

// Closing buttons use the same dismissal path as Escape and the backdrop.
export function DialogClose({ className, variant = "secondary", size = "default", onClick, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const state = useContext(DialogContext);
  return <button type="button" {...props} className={buttonStyles({ className, variant, size })} onClick={event => { onClick?.(event); if (!event.defaultPrevented) state?.close(); }} />;
}
