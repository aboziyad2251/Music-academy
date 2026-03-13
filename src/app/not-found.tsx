"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
      <h2 className="text-4xl font-bold text-slate-900 mb-4">404 - Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-md text-center">
        Could not find the requested resource. The page might have been removed or the URL is incorrect.
      </p>
      <Link href="/">
        <Button className="bg-accent hover:bg-accent/90">Return Home</Button>
      </Link>
    </div>
  );
}
