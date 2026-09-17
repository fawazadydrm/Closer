"use client";

import type { ReactNode } from "react";
import { CloserProvider } from "./CloserContext";
import { UIProvider } from "./UIContext";
import Toaster from "@/components/ui/Toaster";
import DealDrawer from "@/components/drawer/DealDrawer";
import AddDealModal from "@/components/deal/AddDealModal";

/** Single composition root for all global client providers. */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CloserProvider>
      <UIProvider>
        {children}
        <DealDrawer />
        <AddDealModal />
        <Toaster />
      </UIProvider>
    </CloserProvider>
  );
}
