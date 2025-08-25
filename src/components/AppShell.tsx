import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import FooterNav from "./FooterNav";
import { Button } from "@/components/ui/button";

export default function AppShell({ children }: { children: ReactNode }) {
  

  

  return (
     <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-sm h-14 px-4 flex items-center justify-between">
          <Link to="/" className="text-base font-semibold truncate">
            Vehicle Maintenance Log
          </Link>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Page content */}
       <main
        className="
          mx-auto w-full max-w-screen-sm
          flex-1 px-4 pt-4
          pb-[calc(56px+env(safe-area-inset-bottom))]
          sm:pb-[calc(64px+env(safe-area-inset-bottom))]
        "
      >
        {children}
      </main>

      

      {/* Footer nav */}
      <div className="
          fixed bottom-0 left-0 right-0 z-40
          pb-[env(safe-area-inset-bottom)]
        ">
        <div className="mx-auto w-full max-w-screen-sm">
          <FooterNav />
        </div>
      </div>
    </div>
  );
}