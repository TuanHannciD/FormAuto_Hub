"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
    }
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? "";

export function GoogleIdentityButton({
  text,
  disabled = false,
  onCredential,
  onUnavailable
}: {
  text: "signin_with" | "signup_with" | "continue_with";
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onUnavailable?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const credentialCallback = useRef(onCredential);
  credentialCallback.current = onCredential;
  const initialized = useRef<GoogleAccountsId | null>(null);
  const lastRender = useRef<{ width: number; scale: number; text: string; provider: GoogleAccountsId } | null>(null);
  const focusFrame = useRef<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  const renderGoogleButton = useCallback(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    const googleId = window.google?.accounts?.id;

    if (!container || !viewport || !googleId || !GOOGLE_CLIENT_ID || disabled || viewport.clientWidth === 0) {
      return;
    }

    // GIS large is 40px tall. Scale uniformly to the mobile 44px target.
    // Its supported short label avoids a translated min-content width exceeding the popup.
    const scale = window.matchMedia("(max-width: 639px)").matches ? 1.1 : 1;
    const width = Math.min(Math.floor(viewport.clientWidth / scale), 400);
    const buttonText = width < 320 ? "signin" : text;
    const previous = lastRender.current;
    if (previous?.width === width && previous.scale === scale && previous.text === buttonText && previous.provider === googleId) return;

    if (initialized.current !== googleId) {
      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: response => {
          if (response.credential) credentialCallback.current(response.credential);
        }
      });
      initialized.current = googleId;
    }
    const hadFocus = container.contains(document.activeElement);
    container.replaceChildren();
    container.style.width = `${width}px`;
    container.style.transform = `scale(${scale})`;
    lastRender.current = { width, scale, text: buttonText, provider: googleId };
    googleId.renderButton(container, {
      theme: "outline",
      size: "large",
      text: buttonText,
      shape: "rectangular",
      width
    });
    if (hadFocus) {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      focusFrame.current = requestAnimationFrame(() => {
        if (document.activeElement === document.body) container.querySelector<HTMLElement>("[role='button'], button, iframe")?.focus();
        focusFrame.current = null;
      });
    }
  }, [disabled, text]);

  useEffect(() => {
    renderGoogleButton();
  }, [renderGoogleButton, scriptReady]);

  useEffect(() => {
    const observer = new ResizeObserver(renderGoogleButton);
    if (viewportRef.current) observer.observe(viewportRef.current);
    window.addEventListener("resize", renderGoogleButton);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", renderGoogleButton);
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    };
  }, [renderGoogleButton]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        className="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl border border-border bg-surface-subtle px-4 py-2 text-sm font-semibold text-secondary-foreground"
        disabled
        type="button"
      >
        Đăng nhập với Google hiện chưa khả dụng
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setScriptFailed(true);
          onUnavailable?.();
        }}
      />
      {(!scriptReady || scriptFailed) && (
        <p role="status" className="flex min-h-[54px] items-center justify-center rounded-xl border border-border bg-surface-subtle px-4 text-center text-sm text-secondary-foreground">
          {scriptFailed ? "Đăng nhập với Google hiện chưa khả dụng" : "Đang tải đăng nhập với Google..."}
        </p>
      )}
      <div ref={viewportRef} className={scriptReady && !scriptFailed ? "flex min-h-11 min-w-0 w-full items-center justify-center sm:min-h-10" : "flex min-w-0 w-full items-center justify-center"}>
        <div ref={containerRef} className="shrink-0 origin-center" />
      </div>
    </div>
  );
}
