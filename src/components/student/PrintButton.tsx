"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold print:hidden"
    >
      <Download className="me-2 h-4 w-4" />
      Save as PDF
    </Button>
  );
}
