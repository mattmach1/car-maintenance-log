import { Link, useLocation } from "react-router-dom";
import { Home, Car, Wrench, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { name: string; path: string; icon: React.ElementType };

const items: Item[] = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Vehicles", path: "/vehicles", icon: Car },
  { name: "Records", path: "/records", icon: Wrench },
  { name: "Reports", path: "/reports", icon: BarChart3 },
];

export default function FooterNav() {
  const { pathname } = useLocation();

  return (
    <nav className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="mx-auto max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-5xl h-14 px-2 grid grid-cols-4 gap-1">
        {items.map(({ name, path, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Button
              key={path}
              asChild
              variant={active ? "default" : "ghost"}
              className={cn(
                "h-10 w-full flex flex-col items-center justify-center gap-1",
                active ? "shadow-sm" : "text-muted-foreground"
              )}
            >
              <Link to={path} aria-current={active ? "page" : undefined}>
                <Icon className="h-4 w-4 mx-auto" />
                <span className="text-[11px] leading-none">{name}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}