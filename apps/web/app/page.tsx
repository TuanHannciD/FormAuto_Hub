"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasUsableSession } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasUsableSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Đang mở FormAuto Hub...
    </main>
  );
}
