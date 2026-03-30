"use client";

import { useEffect } from "react";
import { ErrorAlert } from "@/components/error-alert";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorAlert
      title="Unable to load this view"
      message="Please try again. If the problem persists, the page shell is still intact and the next milestone will add more robust data handling."
      onRetry={reset}
    />
  );
}
