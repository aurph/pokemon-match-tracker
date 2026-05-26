import Link from "next/link";
import { LayoutDashboard, ScrollText } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: ScrollText },
];

export function Nav() {
  return (
    <nav className="flex gap-1 border-b border-p-border bg-p-surface px-4 py-2 sm:w-52 sm:flex-col sm:gap-2 sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      <span className="hidden px-2 pb-2 font-mono text-xs font-semibold tracking-wide text-p-primary sm:block">
        ELGYEM CONTROL
      </span>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-p-muted hover:bg-p-kpi-bg hover:text-p-title"
        >
          <Icon size={18} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
