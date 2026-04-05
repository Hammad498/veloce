"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, BarChart2, Zap, LogOut, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { user: { name?: string | null; email?: string | null; role?: string } };

const links = [
  { href: "/dashboard", label: "Pipeline", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
];

export default function DashboardNav({ user }: Props) {
  const path = usePathname();

  return (
    <aside className="w-60 bg-gradient-to-b from-slate-900 to-slate-950 glass-panel-dark flex flex-col shrink-0 h-screen sticky top-0 border-r border-accent-green/10 rounded-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-accent-green/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-green to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-green/50 group-hover:shadow-accent-green/70 transition-all">
            <Zap className="w-5 h-5 text-black font-bold" />
          </div>
          <span className="text-white font-bold text-lg">Veloce</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group relative",
                active
                  ? "bg-gradient-to-r from-accent-green/20 to-emerald-600/20 text-accent-green border border-accent-green/30 shadow-lg shadow-accent-green/10"
                  : "text-text-secondary hover:text-accent-green hover:bg-accent-green/10 border border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-colors", active ? "text-accent-green" : "text-text-muted")} />
              {label}
              {active && (
                <ChevronRight className="w-4 h-4 ml-auto text-accent-green" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-accent-green/10">
        <div className="glass-panel p-4 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-green/30 to-emerald-600/30 rounded-lg flex items-center justify-center shrink-0 border border-accent-green/20">
              <User className="w-5 h-5 text-accent-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name ?? user.email}</p>
              <p className="text-text-muted text-xs">{user.role}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-accent-green hover:bg-accent-green/10 rounded-lg transition-all duration-300 border border-transparent hover:border-accent-green/30 text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
