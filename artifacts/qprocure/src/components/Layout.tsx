import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Atom,
  Code2,
  Activity,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/procurement", label: "Procurement", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/quantum-lab", label: "Quantum Lab", icon: Atom },
  { href: "/quantum-code", label: "Code Viewer", icon: Code2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background circuit-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center quantum-glow">
              <Atom className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-wide">QProcure</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Quantum Intelligence</p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/15">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] text-primary font-medium tracking-widest uppercase">Quantum Ready</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                    active
                      ? "bg-primary/10 text-primary border border-primary/25 quantum-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      href === "/quantum-lab" && active && "quantum-pulse"
                    )}
                  />
                  <span>{label}</span>
                  {href === "/quantum-lab" && (
                    <Zap className="w-2.5 h-2.5 ml-auto text-accent" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Powered by Qiskit Aer Simulator<br />
            <span className="text-primary/60">Real Quantum Circuits</span>
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
