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
      text?: "signin_with" | "signup_with" | "continue_with";
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
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [renderNonce, setRenderNonce] = useState(0);

  const renderGoogleButton = useCallback(() => {
    const container = containerRef.current;
    const googleId = window.google?.accounts?.id;

    if (!container || !googleId || !GOOGLE_CLIENT_ID || disabled) {
      return;
    }

    container.replaceChildren();
    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      }
    });
    googleId.renderButton(container, {
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      width: Math.min(container.clientWidth || 360, 400)
    });
  }, [disabled, onCredential, text]);

  useEffect(() => {
    renderGoogleButton();
  }, [renderGoogleButton, renderNonce, scriptReady]);

  useEffect(() => {
    function handleResize() {
      setRenderNonce((value) => value + 1);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div ref={containerRef} className={scriptReady && !scriptFailed ? "flex min-h-10 w-full items-center justify-center" : "flex w-full items-center justify-center"} />
    </div>
  );
}
