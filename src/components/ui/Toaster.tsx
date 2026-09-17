"use client";

import { CheckCircle2 } from "lucide-react";
import { useUI } from "@/state/UIContext";

export default function Toaster() {
  const { toast } = useUI();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-8">
      <div className="glass-panel pointer-events-auto flex items-center gap-2 border-success/30 bg-white px-4 py-2.5 text-sm font-medium text-success animate-fade-in">
        <CheckCircle2 className="h-4 w-4 text-success" />
        {toast}
      </div>
    </div>
  );
}
