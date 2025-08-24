import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import FooterNav from "./FooterNav";
import { Button } from "@/components/ui/button";

export default function AppShell({ children }: { children: ReactNode }) {
  

  

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-4 py-3 font-semibold">
         <Link to="/" className="text-base font-semibold">
            Vehicle Maintenance Log
          </Link>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-6">{children}</main>

      {/* Floating Add button (Add Record) */}
      <Button
        asChild
        className="fixed right-4 bottom-20 z-40 rounded-full shadow-md"
      ></Button>

      {/* Footer nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-screen-sm">
          <FooterNav />
        </div>
      </div>
    </div>
  );
}