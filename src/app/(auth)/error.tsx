"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth routing error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Error</h2>
      <p className="text-slate-500 mb-6 max-w-md">
        We encountered an error during authentication. 
      </p>
      <Link href="/login">
        <Button className="bg-accent hover:bg-accent/90 text-white">
          Back to Login
        </Button>
      </Link>
    </div>
  );
}
