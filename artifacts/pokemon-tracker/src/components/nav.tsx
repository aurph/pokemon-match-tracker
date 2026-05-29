import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ScrollText,
  Library,
  Coins,
  GitBranch,
  Trophy,
  Settings,
} from "lucide-react";
import { PixelSprite } from "@/components/pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: ScrollText },
  { href: "/decklist", label: "Decklist", icon: Library },
  { href: "/prizes", label: "Prizes", icon: Coins },
  { href: "/iterations", label: "Iterations", icon: GitBranch },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const [location] = useLocation();
  return (
    <nav className="flex items-center gap-2 overflow-x-auto border-b-2 border-p-title bg-p-surface px-4 py-2 sm:w-56 sm:flex-col sm:items-stretch sm:gap-1 sm:overflow-visible sm:border-b-0 sm:border-r-2 sm:px-3 sm:py-5">
      <div className="flex shrink-0 items-center gap-2 sm:mb-5 sm:px-1">
        <PixelSprite src={POKEBALL_SPRITE} alt="" size={32} />
        <span className="hidden font-pixel text-[11px] leading-[1.5] text-p-primary sm:block">
          MATCH
          <br />
          TRACKER
        </span>
      </div>
      <div className="flex flex-1 justify-around gap-1 sm:flex-none sm:flex-col sm:justify-start">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors sm:justify-start ${
                active
                  ? "border-p-primary bg-p-kpi-bg text-p-primary"
                  : "border-transparent text-p-muted hover:border-p-border hover:bg-p-kpi-bg hover:text-p-title"
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
