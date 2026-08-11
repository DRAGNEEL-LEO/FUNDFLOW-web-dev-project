import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Edit2, LogOut, Settings, Trash2, Wallet, X } from "lucide-react";
import type { ProfileInfo, Role } from "../types";

export const fmt = (n: number) => `Tk ${n.toLocaleString()}`;
export const fmtK = (n: number) => n >= 1000 ? `Tk ${(n / 1000).toFixed(0)}k` : `Tk ${n}`;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Badge({ label, variant }: { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    neutral: "bg-gray-100 text-gray-600 border border-gray-200",
    info: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono", styles[variant])}>{label}</span>;
}

export function Avatar({ initials, size = "md", color = "#0B4832" }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return <div className={cn("rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0", sz)} style={{ backgroundColor: color }}>{initials}</div>;
}

export function StatCard({ label, value, sub, icon: Icon, trend, color = "primary" }: {
  label: string; value: string; sub?: string; icon: React.ElementType; trend?: number; color?: string;
}) {
  const trendPositive = trend !== undefined && trend >= 0;
  const iconColors: Record<string, string> = {
    primary: "bg-emerald-900 text-emerald-400",
    income: "bg-emerald-50 text-emerald-700",
    expense: "bg-red-50 text-red-600",
    members: "bg-indigo-50 text-indigo-600",
    balance: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="bg-card rounded-2xl p-5 border border-border flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColors[color] || iconColors.primary)}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-mono font-medium", trendPositive ? "text-emerald-600" : "text-red-500")}>
            {trendPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold font-mono text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-border animate-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" />
    </div>
  );
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", className }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; className?: string }) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all cursor-pointer border";
  const variants = {
    primary: "bg-primary text-primary-foreground border-primary hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80",
    ghost: "bg-transparent text-foreground border-border hover:bg-muted",
    danger: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };
  return <button onClick={onClick} className={cn(base, variants[variant], sizes[size], className)}>{children}</button>;
}

export function SidebarLayout({ view, onView, role, onLogout, sidebarOpen, onClose, children }: { view: string; onView: (v: string) => void; role: Role; onLogout: () => void; sidebarOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  const nav = role === "admin"
    ? [
        { id: "dashboard", label: "Dashboard", icon: Wallet },
        { id: "members", label: "Members", icon: Wallet },
        { id: "income", label: "Fund Income", icon: Wallet },
        { id: "expenses", label: "Expenses", icon: Wallet },
        { id: "reports", label: "Reports", icon: Wallet },
        { id: "announcements", label: "Announcements", icon: Wallet },
        { id: "ai", label: "AI Analysis", icon: Wallet },
      ]
    : [
        { id: "member-home", label: "My Dashboard", icon: Wallet },
        { id: "announcements", label: "Announcements", icon: Wallet },
        { id: "ai", label: "AI Insights", icon: Wallet },
      ];

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "Outfit, sans-serif" }}>
      <>
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
        <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col w-60 transition-transform duration-300", "lg:translate-x-0 lg:static lg:z-auto", sidebarOpen ? "translate-x-0" : "-translate-x-full")} style={{ background: "linear-gradient(135deg, rgba(9, 24, 42, 0.95), rgba(11, 72, 50, 0.85))", backdropFilter: "blur(10px)", fontFamily: "Outfit, sans-serif", borderRight: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/8">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"><Wallet size={16} className="text-white" /></div>
            <span className="text-white font-semibold text-lg" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span>
          </div>
          <div className="px-6 pt-5 pb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/8 text-white/50 uppercase tracking-wider">{role === "admin" ? "Admin Portal" : "Member Portal"}</span>
          </div>
          <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
            {nav.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <button key={id} onClick={() => { onView(id); onClose(); }} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-all", active ? "bg-accent/20 text-accent font-medium" : "text-white/60 hover:text-white/90 hover:bg-white/8")}> 
                  <Icon size={17} /> {label} {active && <span className="ml-auto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></span>}
                </button>
              );
            })}
          </nav>
          <div className="px-3 pb-5 pt-3 border-t border-white/8">
            <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"><LogOut size={16} /> Sign Out</button>
          </div>
        </aside>
      </>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-20">{children}</div>
    </div>
  );
}

export function AppHeader({ title, subtitle, onMenuClick, profile, onEditProfile, onLogout }: { title: string; subtitle?: string; onMenuClick: () => void; profile: ProfileInfo; onEditProfile: () => void; onLogout: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 right-auto z-40 w-11/12 max-w-6xl rounded-2xl px-6 py-4 border border-emerald-400/25 shadow-[0_12px_40px_rgba(0,0,0,0.28)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-300" style={{ background: "linear-gradient(135deg, rgba(2, 6, 23, 0.96), rgba(5, 150, 105, 0.95))", backdropFilter: "blur(14px)" }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white truncate" style={{ fontFamily: "Fraunces, serif" }}>{title}</h1>
            {subtitle && <p className="text-xs text-emerald-100/90 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotificationsOpen(v => !v)} className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors relative">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-2-2v-3a7 7 0 1 0-14 0v3l-2 2h5" /><path d="M9 17a3 3 0 0 0 6 0" /></svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-300" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-xl shadow-black/20 z-50 overflow-hidden" style={{ background: "rgba(2, 6, 23, 0.97)", backdropFilter: "blur(10px)" }}>
                <div className="px-4 py-3 border-b border-white/10"><p className="text-sm font-semibold text-white">Notifications</p></div>
                <div className="max-h-64 overflow-y-auto"><div className="p-3 flex flex-col gap-2">{[{ title: "New member joined", time: "5 min ago" }, { title: "Monthly report ready", time: "1 hour ago" }, { title: "Expense approved", time: "3 hours ago" }].map((notif, i) => <div key={i} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/10 hover:border-emerald-400/20"><div className="flex items-start gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div><div className="min-w-0 flex-1"><p className="text-sm text-white font-medium">{notif.title}</p><p className="text-xs text-slate-300 mt-0.5">{notif.time}</p></div></div></div>)}</div></div>
              </div>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/15 transition-colors">
              <Avatar initials={profile.initials} size="sm" />
              <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">{profile.name.split(" ")[0]}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-xl shadow-black/20 z-50 overflow-hidden" style={{ background: "rgba(2, 6, 23, 0.97)", backdropFilter: "blur(10px)" }}>
                <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3"><Avatar initials={profile.initials} size="md" /><div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{profile.name}</p><p className="text-xs text-slate-300 truncate">{profile.email}</p><Badge label={profile.role} variant={profile.role === "admin" ? "info" : "success"} /></div></div>
                <div className="p-2">
                  <button onClick={() => { setProfileOpen(false); onEditProfile(); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 hover:bg-white/10 transition-colors"><div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><Edit2 size={13} className="text-emerald-300" /></div><span>Edit Profile</span></button>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 hover:bg-white/10 transition-colors" onClick={() => setProfileOpen(false)}><div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><Settings size={13} className="text-emerald-300" /></div><span>Settings</span></button>
                  <div className="h-px bg-white/10 my-2" />
                  <button onClick={() => { setProfileOpen(false); onLogout(); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors"><div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0"><LogOut size={13} className="text-red-300" /></div><span>Sign Out</span></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
