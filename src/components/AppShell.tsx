import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
//import { Settings } from "lucide-react";
import FooterNav from "./FooterNav";
//import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-5xl h-14 px-4 flex items-center justify-between">
          <Link to="/" className="text-base lg:text-lg font-semibold truncate">
            Vehicle Maintenance Log
          </Link>
          { /*<Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button> */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop-only nav */}
        <div className="hidden lg:block">
          <div className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-5xl px-4 h-10 flex items-center gap-4 text-sm">
            <div className="ml-auto flex gap-4">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/vehicles"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }
              >
                Vehicles
              </NavLink>
              <NavLink
                to="/records"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }
              >
                Records
              </NavLink>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }
              >
                Reports
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main
        className="
    mx-auto w-full
    max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-5xl
    flex-1 px-4 pt-4
    pb-[calc(56px+env(safe-area-inset-bottom))]
    sm:pb-[calc(64px+env(safe-area-inset-bottom))]
  "
      >
        {children}
      </main>

      {/* Footer nav */}
      <div
        className="
          fixed bottom-0 left-0 right-0 z-40
          pb-[env(safe-area-inset-bottom)]
        "
      >
        <div className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-5xl">
          <FooterNav />
        </div>
      </div>
    </div>
  );
}
