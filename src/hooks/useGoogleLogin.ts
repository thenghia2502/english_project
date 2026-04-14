// hooks/useGoogleLogin.ts
"use client";

import { useCallback } from "react";

export function useGoogleLogin() {
  const loginWithGoogle = useCallback((returnTo?: string) => {
    const url = returnTo
      ? `/api/proxy/auth/google?returnTo=${encodeURIComponent(returnTo)}`
      : `/api/proxy/auth/google`;

    // 👉 redirect browser (KHÔNG dùng fetch)
    window.location.href = url;
  }, []);

  return { loginWithGoogle };
}