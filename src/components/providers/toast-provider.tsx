"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      richColors
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "hsl(220 18% 10%)",
          border: "1px solid hsl(220 14% 18%)",
          color: "hsl(210 20% 92%)",
        },
      }}
    />
  );
}
