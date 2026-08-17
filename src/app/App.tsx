import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { apiFetch, getStoredAuth, storeAuth, clearAuth } from "./api";
import {
  validateLoginPayload,
  validateRegisterPayload,
  validateRegisterOrgPayload,
  validateTransactionPayload,
  validateMemberPayload,
  validateAnnouncementPayload,
} from "../../lib/validation.js";
import {
  LayoutDashboard, Users, TrendingUp, TrendingDown, BarChart2,
  Bell, Sparkles, LogOut, Search, Plus, ArrowUpRight, ArrowDownRight,
  Edit2, Trash2, X, Download, Wallet, Menu,
  Megaphone, CreditCard, AlertCircle, Check,
  User, ChevronRight, Activity, Target,
  ArrowRight, Star, Lock, Shield, Settings,
  FileText, SlidersHorizontal, FileCheck, QrCode, Building2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  exportOrganizationPDF,
  exportIncomeReport,
  exportExpenseReport,
  exportMembersReport,
  exportPaymentReceiptPDF,
  exportContributionCertificatePDF,
} from "./utils/pdfExport";
import { PaymentModal } from "./components/PaymentModal";

/* ─────────────────────────── TYPES ─────────────────────────── */
type Role = "admin" | "member";
type AppPage = "landing" | "login" | "app";
type View =
  | "login"
  | "dashboard"
  | "members"
  | "income"
  | "expenses"
  | "reports"
  | "announcements"
  | "ai"
  | "member-home";

interface ProfileInfo {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: Role;
  initials: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  joined: string;
  status: "active" | "inactive";
  contributions: number;
  outstanding: number;
  phone: string;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  status: "completed" | "pending";
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  author: string;
}

/* ─────────────────────────── SEED DATA ─────────────────────── */
const MONTHLY_DATA = [
  { month: "Oct", income: 184000, expenses: 72000 },
  { month: "Nov", income: 210000, expenses: 89000 },
  { month: "Dec", income: 195000, expenses: 124000 },
  { month: "Jan", income: 228000, expenses: 93000 },
  { month: "Feb", income: 241000, expenses: 108000 },
  { month: "Mar", income: 331000, expenses: 80500 },
  { month: "Apr", income: 282000, expenses: 113000 },
];

const EXPENSE_PIE = [
  { name: "Operations", value: 21000, color: "#0B4832" },
  { name: "Events", value: 34000, color: "#14C768" },
  { name: "Welfare", value: 36000, color: "#F59E0B" },
  { name: "Education", value: 22000, color: "#6366F1" },
  { name: "Admin", value: 18500, color: "#EC4899" },
];

/* ─────────────────────────── HELPERS ─────────────────────────── */
const fmt = (n: number) => `Tk ${n.toLocaleString()}`;
const fmtK = (n: number) => n >= 1000 ? `Tk ${(n / 1000).toFixed(0)}k` : `Tk ${n}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ─────────────────────────── UI ATOMS ─────────────────────────── */
function Badge({ label, variant }: { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    neutral: "bg-gray-100 text-gray-600 border border-gray-200",
    info: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono", styles[variant])}>
      {label}
    </span>
  );
}

function Avatar({ initials, size = "md", color = "#0B4832" }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0", sz)}
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, trend, color = "primary" }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: number; color?: string;
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
          <span className={cn("flex items-center gap-0.5 text-xs font-mono font-medium",
            trendPositive ? "text-emerald-600" : "text-red-500")}>
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

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
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

function Input({ label, value, onChange, type = "text", placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "px-3 py-2.5 rounded-lg border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all",
          error ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-ring focus:border-transparent"
        )}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5 font-medium">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", className, disabled }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md"; className?: string; disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all cursor-pointer border";
  const variants = {
    primary: "bg-primary text-primary-foreground border-primary hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80",
    ghost: "bg-transparent text-foreground border-border hover:bg-muted",
    danger: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant], sizes[size], disabled && "opacity-50 cursor-not-allowed", className)}>
      {children}
    </button>
  );
}

/* ─────────────────────────── LANDING PAGE ─────────────────────────── */
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const features = [
    { icon: LayoutDashboard, title: "Admin Dashboard", desc: "Complete financial overview with real-time stats, recent transactions, and quick-action controls in one place." },
    { icon: Users, title: "Member Management", desc: "Add, edit, and track members with contribution status, outstanding balances, and activity history." },
    { icon: TrendingUp, title: "Fund & Income Tracking", desc: "Record all income streams — contributions, donations, sponsorships, membership fees — automatically." },
    { icon: TrendingDown, title: "Expense Management", desc: "Categorize and track every expense. Export reports and monitor spending patterns over time." },
    { icon: BarChart2, title: "Reports & Analytics", desc: "Interactive charts and detailed reports for monthly income, expenses, and fund balance trends." },
    { icon: Sparkles, title: "AI Financial Analysis", desc: "AI-powered insights including health scores, spending analysis, 30-day forecasts, and budget recommendations." },
  ];

  const steps = [
    { num: "01", title: "Register your organization", desc: "Set up your account in minutes and invite your admin team to get started." },
    { num: "02", title: "Add members & record finances", desc: "Import or add members, then start recording income and expenses immediately." },
    { num: "03", title: "Gain insights & act", desc: "Review AI-generated reports and recommendations to make better financial decisions." },
  ];

  const testimonials = [
    { name: "Dr. Farida Rahman", role: "Chairman, Dhaka Community Trust", text: "FundFlow transformed our financial management completely. We went from spreadsheet chaos to full clarity in one week." },
    { name: "Nadia Hasan", role: "Treasurer, GreenVoice NGO", text: "The AI analysis feature alone saved us from a potential cash flow crisis. It predicted the shortfall 30 days before it happened." },
    { name: "Tanjil Ahmed", role: "Secretary General, Dhaka University Students Society", text: "Our members now trust the organization more because they can see exactly where every taka goes." },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Floating Glass Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-6xl" style={{ backdropFilter: "blur(14px)" }}>
        <div className="px-6 h-16 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-slate-950/95 via-emerald-950/95 to-slate-900/95 shadow-[0_12px_40px_rgba(0,0,0,0.28)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white text-lg" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-200">
            {["Features", "How It Works", "Testimonials"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-white transition-colors duration-200">{l}</a>
            ))}
          </div>
          <button onClick={onGetStarted}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors">
            Sign In <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-secondary-foreground/10 text-secondary-foreground text-xs font-medium mb-6">
              <Sparkles size={12} className="text-accent" /> AI-Powered Fund Management Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight text-foreground mb-6"
              style={{ fontFamily: "Fraunces, serif" }}>
              Manage your organization&apos;s funds with <em className="not-italic text-primary">clarity</em> and confidence
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              FundFlow digitalizes financial management for NGOs, community groups, religious organizations, and student clubs — with real-time tracking, intelligent reports, and AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onGetStarted}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-base">
                Get Started Free <ArrowRight size={16} />
              </button>
              <button onClick={onGetStarted}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors text-base">
                View Demo
              </button>
            </div>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {[
              { label: "Organizations", value: "500+" },
              { label: "Funds Managed", value: "Tk 2.4B+" },
              { label: "Active Members", value: "18,000+" },
              { label: "Accuracy Rate", value: "99.8%" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl p-5 border border-border text-center">
                <p className="text-2xl font-semibold font-mono text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-sm font-medium mb-2">Everything you need</p>
            <h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              Powerful features for every organization
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From a small student club to a national NGO — FundFlow scales to your needs with tools built for real-world financial management.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-border bg-background hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "Fraunces, serif" }}>{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-sm font-medium mb-2">Simple to set up</p>
            <h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              Up and running in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-y-px z-0" style={{ width: "calc(100% - 2rem)" }} />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold font-mono mb-5" style={{ fontFamily: "Fraunces, serif" }}>
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2" style={{ fontFamily: "Fraunces, serif" }}>{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security strip */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {[
              { icon: Lock, label: "End-to-end encrypted" },
              { icon: Shield, label: "Role-based access control" },
              { icon: Activity, label: "Real-time audit logs" },
              { icon: Check, label: "99.9% uptime guarantee" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon size={16} className="text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-accent text-sm font-medium mb-2">Trusted by leaders</p>
            <h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              What our users say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 mx-6 mb-10 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #14C768 0%, transparent 55%)" }} />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-semibold text-white mb-4" style={{ fontFamily: "Fraunces, serif" }}>
            Ready to bring clarity to your finances?
          </h2>
          <p className="text-white/60 mb-8 text-lg">Join hundreds of organizations already using FundFlow to manage funds with confidence.</p>
          <button onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-medium text-base hover:opacity-90 transition-opacity">
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 pb-10">
        <div className="max-w-6xl mx-auto rounded-3xl border border-border bg-card p-8 md:p-10 shadow-sm">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <p className="text-accent text-sm font-medium mb-2">Contact us</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                Let&apos;s talk about your funding goals
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl leading-relaxed">
                Reach out for demos, onboarding support, or custom plans for your organization. We&apos;re here to help you simplify fund management.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a href="mailto:hello@fundflow.org" className="text-sm text-primary hover:underline">hello@fundflow.org</a>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <a href="tel:+2348000000000" className="text-sm text-primary hover:underline">+234 800 000 0000</a>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Office</p>
                <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Wallet size={14} className="text-white" />
            </div>
            <span className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 FundFlow. Smart Fund Management for Every Organization.</p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────── LOGIN & REGISTER ORG ─────────────────────────── */
function LoginView({
  onLogin,
  onBack,
}: {
  onLogin: (role: Role, token: string, name: string, email: string, orgName?: string, orgId?: string) => void;
  onBack?: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("admin@fundflow.org");
  const [loginPassword, setLoginPassword] = useState("password");
  const [loginError, setLoginError] = useState("");
  const [loginFieldErrors, setLoginFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Org form state
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginSubmit = async () => {
    const val = validateLoginPayload({ email: loginEmail, password: loginPassword });
    if (!val.isValid) {
      setLoginFieldErrors(val.errors);
      setLoginError("Please resolve the input errors below.");
      return;
    }
    setLoginFieldErrors({});
    setLoginLoading(true);
    setLoginError("");

    try {
      const data = await apiFetch<{
        token: string;
        role: Role;
        name: string;
        email: string;
        orgName?: string;
        orgId?: string;
      }>("/api/login", {
        method: "POST",
        body: { email: loginEmail, password: loginPassword },
      });
      storeAuth({
        token: data.token,
        role: data.role,
        name: data.name,
        email: data.email,
        orgName: data.orgName,
        orgId: data.orgId,
      });
      onLogin(data.role, data.token, data.name, data.email, data.orgName, data.orgId);
    } catch (err: any) {
      if (err?.details) {
        setLoginFieldErrors(err.details);
      }
      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterOrgSubmit = async () => {
    const val = validateRegisterOrgPayload({
      orgName,
      adminName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
    });

    const localErrors = { ...val.errors };
    if (regPassword !== regConfirmPassword) {
      localErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(localErrors).length > 0) {
      setRegFieldErrors(localErrors);
      setRegError("Please resolve the validation errors below.");
      return;
    }

    setRegFieldErrors({});
    setRegLoading(true);
    setRegError("");

    try {
      const data = await apiFetch<{
        success: boolean;
        token: string;
        role: Role;
        name: string;
        email: string;
        orgName: string;
        orgId: string;
      }>("/api/register-org", {
        method: "POST",
        body: {
          orgName,
          adminName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
        },
      });

      storeAuth({
        token: data.token,
        role: data.role,
        name: data.name,
        email: data.email,
        orgName: data.orgName,
        orgId: data.orgId,
      });

      onLogin(data.role, data.token, data.name, data.email, data.orgName, data.orgId);
    } catch (err: any) {
      if (err?.details) {
        setRegFieldErrors(err.details);
      }
      setRegError(err instanceof Error ? err.message : "Organization registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[50%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B2D1C 60%, #0B4832 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-white text-2xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
              FundFlow
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-semibold leading-tight text-white mb-5" style={{ fontFamily: "Fraunces, serif" }}>
            Smart fund<br />management for<br />
            <em className="not-italic text-accent">every organization.</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md">
            Create an independent, secure fund management system for your NGO, university club, welfare foundation, or cooperative in seconds.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { label: "Multi-Org Portals", value: "Unlimited" },
            { label: "Ledger Accuracy", value: "100%" },
            { label: "Instant Digital Receipts", value: "Automated" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3.5 border border-white/10 bg-white/5 backdrop-blur-xs">
              <p className="text-white text-lg font-semibold font-mono">{s.value}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-32 -left-16 w-64 h-64 rounded-full bg-accent/5 blur-2xl" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wallet size={16} className="text-white" />
              </div>
              <span className="text-foreground font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
                FundFlow
              </span>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowRight size={13} className="rotate-180" /> Back to home
              </button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-muted/70 rounded-xl border border-border mb-6">
            <button
              onClick={() => {
                setTab("login");
                setLoginError("");
                setRegError("");
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                tab === "login"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                setLoginError("");
                setRegError("");
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                tab === "register"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 size={13} />
              <span>Create Organization</span>
            </button>
          </div>

          {tab === "login" ? (
            /* ────── SIGN IN MODE ────── */
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                Welcome back
              </h2>
              <p className="text-muted-foreground text-xs mb-6">Sign in to access your organization workspace</p>

              <div className="flex flex-col gap-4">
                <Input
                  label="Email address"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  type="email"
                  placeholder="admin@fundflow.org"
                  error={loginFieldErrors.email}
                />
                <Input
                  label="Password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  type="password"
                  placeholder="••••••••"
                  error={loginFieldErrors.password}
                />

                {loginError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <Btn
                  onClick={handleLoginSubmit}
                  className="w-full justify-center mt-1 py-2.5"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Signing in..." : "Sign In to Dashboard"}
                </Btn>
              </div>

              {/* Demo Quick Fill Cards */}
              <div className="mt-6 p-4 rounded-xl bg-muted/60 border border-border text-xs">
                <p className="font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Quick Demo Logins</span>
                  <span className="text-[10px] text-muted-foreground">Click to fill</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setLoginEmail("admin@fundflow.org");
                      setLoginPassword("password");
                    }}
                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border text-left transition-colors cursor-pointer"
                  >
                    <p className="font-semibold text-emerald-700">👑 Admin Portal</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">admin@fundflow.org</p>
                  </button>
                  <button
                    onClick={() => {
                      setLoginEmail("member@fundflow.org");
                      setLoginPassword("password");
                    }}
                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border text-left transition-colors cursor-pointer"
                  >
                    <p className="font-semibold text-primary">👤 Member Portal</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">member@fundflow.org</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ────── REGISTER ORGANIZATION & ADMIN MODE ────── */
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  NEW WORKSPACE
                </span>
                <p className="text-xs text-muted-foreground">Takes less than 1 minute</p>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                Create Organization System
              </h2>
              <p className="text-muted-foreground text-xs mb-5">
                Set up a dedicated fund workspace for your organization and primary administrator account.
              </p>

              <div className="flex flex-col gap-3.5">
                <Input
                  label="Organization / Club / Trust Name *"
                  value={orgName}
                  onChange={setOrgName}
                  placeholder="e.g. Dhaka University IT Society"
                  error={regFieldErrors.orgName}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Administrator Full Name *"
                    value={adminName}
                    onChange={setAdminName}
                    placeholder="e.g. Tanvir Ahmed"
                    error={regFieldErrors.adminName}
                  />
                  <Input
                    label="Phone Number"
                    value={regPhone}
                    onChange={setRegPhone}
                    placeholder="+880 1700 000000"
                    error={regFieldErrors.phone}
                  />
                </div>

                <Input
                  label="Official Admin Email Address *"
                  value={regEmail}
                  onChange={setRegEmail}
                  type="email"
                  placeholder="admin@yourorg.org"
                  error={regFieldErrors.email}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Master Password *"
                    value={regPassword}
                    onChange={setRegPassword}
                    type="password"
                    placeholder="Min 6 characters"
                    error={regFieldErrors.password}
                  />
                  <Input
                    label="Confirm Password *"
                    value={regConfirmPassword}
                    onChange={setRegConfirmPassword}
                    type="password"
                    placeholder="Re-enter password"
                    error={regFieldErrors.confirmPassword}
                  />
                </div>

                {regError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <Btn
                  onClick={handleRegisterOrgSubmit}
                  className="w-full justify-center mt-2 py-3 bg-emerald-700 hover:bg-emerald-800"
                  disabled={regLoading}
                >
                  {regLoading ? (
                    "Setting up Organization..."
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Create Organization & Launch Dashboard</span>
                    </>
                  )}
                </Btn>
              </div>

              <p className="text-center text-[11px] text-muted-foreground mt-4">
                Already have an organization?{" "}
                <button
                  onClick={() => setTab("login")}
                  className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── SIDEBAR ─────────────────────────── */
const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "income", label: "Fund Income", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "ai", label: "AI Analysis", icon: Sparkles },
];

const MEMBER_NAV = [
  { id: "member-home", label: "My Dashboard", icon: LayoutDashboard },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "ai", label: "AI Insights", icon: Sparkles },
];

function Sidebar({ view, onView, role, onLogout, sidebarOpen, onClose }: {
  view: View; onView: (v: View) => void; role: Role;
  onLogout: () => void; sidebarOpen: boolean; onClose: () => void;
}) {
  const nav = role === "admin" ? ADMIN_NAV : MEMBER_NAV;
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col w-60 transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "linear-gradient(135deg, rgba(9, 24, 42, 0.95), rgba(11, 72, 50, 0.85))", backdropFilter: "blur(10px)", fontFamily: "Outfit, sans-serif", borderRight: "1px solid rgba(255, 255, 255, 0.08)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span>
        </div>

        {/* Role badge */}
        <div className="px-6 pt-5 pb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/8 text-white/50 uppercase tracking-wider">
            {role === "admin" ? "Admin Portal" : "Member Portal"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => { onView(id as View); onClose(); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-all",
                  active
                    ? "bg-accent/20 text-accent font-medium"
                    : "text-white/60 hover:text-white/90 hover:bg-white/8"
                )}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-5 pt-3 border-t border-white/8">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────── HEADER ─────────────────────────── */
function Header({ title, subtitle, onMenuClick, profile, onEditProfile, onLogout }: {
  title: string; subtitle?: string; onMenuClick: () => void;
  profile: ProfileInfo; onEditProfile: () => void; onLogout: () => void;
}) {
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
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white truncate" style={{ fontFamily: "Fraunces, serif" }}>{title}</h1>
            {subtitle && <p className="text-xs text-emerald-100/90 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotificationsOpen(v => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors relative">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-300" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-xl shadow-black/20 z-50 overflow-hidden" style={{ background: "rgba(2, 6, 23, 0.97)", backdropFilter: "blur(10px)" }}>
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 flex flex-col gap-2">
                    {[
                      { title: "New member joined", time: "5 min ago", icon: Users },
                      { title: "Monthly report ready", time: "1 hour ago", icon: BarChart2 },
                      { title: "Expense approved", time: "3 hours ago", icon: Check },
                    ].map((notif, i) => {
                      const Icon = notif.icon;
                      return (
                        <div key={i} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/10 hover:border-emerald-400/20">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Icon size={14} className="text-emerald-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white font-medium">{notif.title}</p>
                              <p className="text-xs text-slate-300 mt-0.5">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/15 transition-colors"
            >
              <Avatar initials={profile.initials} size="sm" />
              <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">{profile.name.split(" ")[0]}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-xl shadow-black/20 z-50 overflow-hidden" style={{ background: "rgba(2, 6, 23, 0.97)", backdropFilter: "blur(10px)" }}>
                {/* User info */}
                <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
                  <Avatar initials={profile.initials} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                    <p className="text-xs text-slate-300 truncate">{profile.email}</p>
                    <Badge label={profile.role} variant={profile.role === "admin" ? "info" : "success"} />
                  </div>
                </div>
                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={() => { setProfileOpen(false); onEditProfile(); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Edit2 size={13} className="text-emerald-300" />
                    </div>
                    <span>Edit Profile</span>
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 hover:bg-white/10 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Settings size={13} className="text-emerald-300" />
                    </div>
                    <span>Settings</span>
                  </button>
                  <div className="h-px bg-white/10 my-2" />
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <LogOut size={13} className="text-red-300" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── EXPORT REPORT MODAL ─────────────────────────── */
interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
  transactions: Transaction[];
  announcements?: Announcement[];
  profile?: ProfileInfo;
}

function ExportReportModal({
  open,
  onClose,
  members,
  transactions,
  announcements = [],
  profile,
}: ExportReportModalProps) {
  const [orgName, setOrgName] = useState(profile?.organization || "FundFlow Community Trust");
  const [reportTitle, setReportTitle] = useState("Executive Financial & Management Report");
  const [reportSubtitle, setReportSubtitle] = useState("Comprehensive performance statement and organizational audit");
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeMonthlyTrend, setIncludeMonthlyTrend] = useState(true);
  const [includeExpenseCategories, setIncludeExpenseCategories] = useState(true);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [transactionLimit, setTransactionLimit] = useState<"10" | "25" | "50" | "all">("25");
  const [includeAnnouncements, setIncludeAnnouncements] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile?.organization) {
      setOrgName(profile.organization);
    }
  }, [profile]);

  if (!open) return null;

  const handleFullQuickExport = () => {
    setExporting(true);
    setSuccess(false);
    setTimeout(() => {
      try {
        exportOrganizationPDF({
          organizationName: orgName || profile?.organization || "FundFlow Community Trust",
          reportTitle: "Executive Financial & Management Report",
          reportSubtitle: "Complete organizational performance and financial ledger audit",
          generatedBy: profile?.name || "System Administrator",
          includeKPIs: true,
          includeMonthlyTrend: true,
          includeExpenseCategories: true,
          includeMembers: true,
          includeTransactions: true,
          transactionLimit: "all",
          includeAnnouncements: true,
          includeSignatures: true,
          monthlyData: MONTHLY_DATA,
          expensePie: EXPENSE_PIE,
          members,
          transactions,
          announcements,
        });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } catch (e) {
        console.error("Export error:", e);
      } finally {
        setExporting(false);
      }
    }, 300);
  };

  const handleCustomExport = () => {
    setExporting(true);
    setSuccess(false);
    setTimeout(() => {
      try {
        exportOrganizationPDF({
          organizationName: orgName || "FundFlow Community Trust",
          reportTitle: reportTitle || "Executive Financial & Management Report",
          reportSubtitle: reportSubtitle || "Comprehensive performance statement and organizational audit",
          generatedBy: profile?.name || "System Administrator",
          includeKPIs,
          includeMonthlyTrend,
          includeExpenseCategories,
          includeMembers,
          includeTransactions,
          transactionLimit,
          includeAnnouncements,
          includeSignatures,
          monthlyData: MONTHLY_DATA,
          expensePie: EXPENSE_PIE,
          members,
          transactions,
          announcements,
        });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } catch (e) {
        console.error("Export error:", e);
      } finally {
        setExporting(false);
      }
    }, 300);
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90vh] animate-in">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                Export Organization PDF Report
              </h3>
              <p className="text-xs text-muted-foreground">
                Download a styled, publication-ready financial audit & organization summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Quick 1-Click Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-900/60 p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                  Instant Executive Export
                </span>
              </div>
              <p className="text-sm font-semibold text-white">Download Complete Official Audit</p>
              <p className="text-xs text-white/70 mt-0.5">
                Includes all KPI cards, 7-month trend, {members.length} members, and {transactions.length} transaction records.
              </p>
            </div>
            <button
              onClick={handleFullQuickExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {exporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Generating...
                </>
              ) : success ? (
                <>
                  <Check size={14} /> Downloaded!
                </>
              ) : (
                <>
                  <Download size={14} /> Quick Download All
                </>
              )}
            </button>
          </div>

          {/* Custom Options Header */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            <SlidersHorizontal size={14} />
            <span>Customize Report Sections</span>
          </div>

          {/* Org & Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={setOrgName}
              placeholder="Organization Name"
            />
            <Input
              label="Report Document Title"
              value={reportTitle}
              onChange={setReportTitle}
              placeholder="e.g. Annual Executive Report"
            />
            <div className="sm:col-span-2">
              <Input
                label="Report Subtitle / Statement"
                value={reportSubtitle}
                onChange={setReportSubtitle}
                placeholder="e.g. Comprehensive performance statement and organizational audit"
              />
            </div>
          </div>

          {/* Section Selection Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={includeKPIs}
                onChange={e => setIncludeKPIs(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">Financial Health & KPI Cards</p>
                <p className="text-muted-foreground mt-0.5">Net balance ({fmt(totalIncome - totalExpenses)}), revenue, dues</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={includeMonthlyTrend}
                onChange={e => setIncludeMonthlyTrend(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">7-Month Monthly Trend Table</p>
                <p className="text-muted-foreground mt-0.5">Inflows, outflows, and net margin %</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpenseCategories}
                onChange={e => setIncludeExpenseCategories(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">Expense Category Breakdown</p>
                <p className="text-muted-foreground mt-0.5">Operations, welfare, education allocations</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={includeMembers}
                onChange={e => setIncludeMembers(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">Member Directory & Ledger</p>
                <p className="text-muted-foreground mt-0.5">{members.length} registered members & dues status</p>
              </div>
            </label>

            <div className="p-3 rounded-xl border border-border bg-card flex flex-col gap-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTransactions}
                  onChange={e => setIncludeTransactions(e.target.checked)}
                  className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Transaction History Ledger</p>
                  <p className="text-muted-foreground mt-0.5">{transactions.length} total receipts & disbursements</p>
                </div>
              </label>
              {includeTransactions && (
                <div className="pl-7 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Rows to include:</span>
                  <select
                    value={transactionLimit}
                    onChange={e => setTransactionLimit(e.target.value as any)}
                    className="px-2 py-1 text-xs rounded border border-border bg-input-background text-foreground"
                  >
                    <option value="10">Last 10 Records</option>
                    <option value="25">Last 25 Records</option>
                    <option value="50">Last 50 Records</option>
                    <option value="all">All Records ({transactions.length})</option>
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnnouncements}
                onChange={e => setIncludeAnnouncements(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">Executive Announcements</p>
                <p className="text-muted-foreground mt-0.5">Notices, meeting minutes & reminders</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer sm:col-span-2">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={e => setIncludeSignatures(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <p className="font-medium text-foreground">Official Verification & Sign-off Block</p>
                <p className="text-muted-foreground mt-0.5">Signature lines for Administrator & Treasurer audit verification</p>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-600" />
            <span>High-res vector PDF with official headers & page numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <Btn onClick={onClose} variant="ghost" size="sm">
              Cancel
            </Btn>
            <Btn
              onClick={handleCustomExport}
              disabled={exporting}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {exporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building PDF...
                </>
              ) : success ? (
                <>
                  <Check size={14} /> PDF Downloaded!
                </>
              ) : (
                <>
                  <Download size={14} /> Generate & Download PDF
                </>
              )}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── DASHBOARD ─────────────────────────── */
function DashboardView({ token, profile }: { token: string; profile?: ProfileInfo }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<Member[]>("/api/members", { token }).then(setMembers).catch(() => {});
    apiFetch<Transaction[]>("/api/transactions", { token }).then(setTransactions).catch(() => {});
    apiFetch<Announcement[]>("/api/announcements", { token }).then(setAnnouncements).catch(() => {});
  }, [token]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const activeMembers = members.filter(m => m.status === "active").length;
  const recent = transactions.slice(0, 6);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const map: Record<string, { month: string; income: number; expenses: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { month: label, income: 0, expenses: 0 };
    }

    transactions.forEach(t => {
      if (!t.date) return;
      const key = t.date.slice(0, 7);
      if (map[key]) {
        if (t.type === "income") map[key].income += t.amount;
        else if (t.type === "expense") map[key].expenses += t.amount;
      }
    });

    return Object.values(map);
  }, [transactions]);

  const expensePie = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    if (expenses.length === 0) return [];
    const catMap: Record<string, number> = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const colors = ["#0B4832", "#14C768", "#F59E0B", "#6366F1", "#EC4899", "#3B82F6", "#8B5CF6"];
    return Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
    }));
  }, [transactions]);

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Top Action & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              Organization Executive Dashboard
            </h2>
            <Badge label="Live Audit" variant="success" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile?.organization || "FundFlow Community Trust"} • Real-time financial & membership status
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportOrganizationPDF({
              organizationName: profile?.organization || "FundFlow Community Trust",
              reportTitle: "Executive Financial & Management Report",
              reportSubtitle: "Complete organizational performance and financial ledger audit",
              generatedBy: profile?.name || "System Administrator",
              includeKPIs: true,
              includeMonthlyTrend: true,
              includeExpenseCategories: true,
              includeMembers: true,
              includeTransactions: true,
              transactionLimit: "all",
              includeAnnouncements: true,
              includeSignatures: true,
              monthlyData,
              expensePie,
              members,
              transactions,
              announcements,
            })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-xs font-medium border border-border transition-colors cursor-pointer"
            title="Download full PDF directly"
          >
            <Download size={14} className="text-muted-foreground" />
            <span>Quick Export</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
          >
            <FileText size={14} />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fund Balance" value={fmt(balance)} sub="As of today" icon={Wallet} color="balance" />
        <StatCard label="Total Income" value={fmt(totalIncome)} sub="Recorded total" icon={TrendingUp} color="income" />
        <StatCard label="Total Expenses" value={fmt(totalExpenses)} sub="Disbursed total" icon={TrendingDown} color="expense" />
        <StatCard label="Active Members" value={String(activeMembers)} sub={`of ${members.length} registered`} icon={Users} color="members" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Income vs Expenses</h3>
              <p className="text-xs text-muted-foreground">Rolling 7-month treasury overview</p>
            </div>
            <Badge label={String(new Date().getFullYear())} variant="neutral" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Outfit" }} />
              <Bar dataKey="income" name="Income" fill="#14C768" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#0B4832" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card rounded-2xl p-5 border border-border flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>Expense Categories</h3>
            <p className="text-xs text-muted-foreground mb-4">Allocation by department</p>
          </div>
          {expensePie.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center text-muted-foreground gap-1.5">
              <TrendingDown size={28} className="text-muted-foreground/50 mb-1" />
              <p className="text-xs font-semibold text-foreground">No expenses recorded yet</p>
              <p className="text-[11px] max-w-[200px] text-muted-foreground">Disbursements recorded in the Expenses tab will appear here.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={expensePie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {expensePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {expensePie.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-foreground">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Recent Transactions</h3>
            <p className="text-xs text-muted-foreground">Latest financial ledger entries</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportIncomeReport(transactions, profile?.organization, profile?.name)}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              title="Export all income transactions to PDF"
            >
              <Download size={13} />
              <span>Income PDF</span>
            </button>
            <button
              onClick={() => exportExpenseReport(transactions, profile?.organization, expensePie, profile?.name)}
              className="flex items-center gap-1 text-xs text-red-700 hover:text-red-800 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
              title="Export all expense transactions to PDF"
            >
              <Download size={13} />
              <span>Expense PDF</span>
            </button>
            <Badge label={`${recent.length} records`} variant="neutral" />
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
              <TrendingUp size={22} />
            </div>
            <p className="text-sm font-semibold text-foreground">No transactions recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Your organization financial ledger is currently empty. Record member collections or organizational expenses to populate this overview.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {["Description", "Category", "Date", "Amount", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((tx, i) => (
                  <tr key={tx.id} className={cn("border-t border-border/50 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                          tx.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                          {tx.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <span className="text-foreground font-medium">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{tx.category}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{fmtDate(tx.date)}</td>
                    <td className={cn("px-5 py-3.5 font-mono font-semibold",
                      tx.type === "income" ? "text-emerald-700" : "text-red-600")}>
                      {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Report Modal */}
      <ExportReportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        members={members}
        transactions={transactions}
        announcements={announcements}
        profile={profile}
      />
    </div>
  );
}

/* ─────────────────────────── MEMBERS ─────────────────────────── */
function MembersView({ token, profile }: { token: string; profile?: ProfileInfo }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [payingMember, setPayingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; status: string; password: string; role: "member" | "admin" }>({
    name: "", email: "", phone: "", status: "active", password: "", role: "member",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(() => {
    apiFetch<Member[]>("/api/members", { token }).then(setMembers).catch(() => {});
  }, [token]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const filtered = useMemo(() =>
    members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    ), [members, search]);

  const openAdd = () => {
    setForm({ name: "", email: "", phone: "", status: "active", password: "", role: "member" });
    setFieldErrors({});
    setModal("add");
  };

  const openAddAdmin = () => {
    setForm({ name: "", email: "", phone: "", status: "active", password: "", role: "admin" });
    setFieldErrors({});
    setModal("add");
  };

  const openEdit = (m: Member) => {
    setEditTarget(m);
    setForm({ name: m.name, email: m.email, phone: m.phone, status: m.status, password: "", role: m.role || "member" });
    setFieldErrors({});
    setModal("edit");
  };

  const handleSave = async () => {
    let val;
    if (modal === "add") {
      val = validateRegisterPayload({
        name: form.name, email: form.email, password: form.password || "password",
        role: form.role, phone: form.phone
      });
    } else {
      val = validateMemberPayload({
        name: form.name, email: form.email, phone: form.phone, status: form.status
      }, true);
    }

    if (!val.isValid) {
      setFieldErrors(val.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      if (modal === "add") {
        const id = String(Date.now());
        const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

        // 1. Create User account (Admin or Member) via /api/register
        await apiFetch("/api/register", {
          method: "POST", token,
          body: {
            email: form.email,
            password: form.password || "password",
            name: form.name,
            role: form.role,
            phone: form.phone,
          },
        });

        // 2. If member profile is also needed, add to members collection
        if (form.role === "member") {
          const doc = {
            id, name: form.name, email: form.email, phone: form.phone,
            role: "member" as const, initials,
            joined: new Date().toISOString().slice(0, 10),
            status: form.status as "active" | "inactive",
            contributions: 0, outstanding: 0,
          };
          await apiFetch("/api/members", { method: "POST", token, body: doc }).catch(() => {});
        }
      } else if (modal === "edit" && editTarget) {
        await apiFetch("/api/members", {
          method: "PUT", token,
          body: { id: editTarget.id, name: form.name, email: form.email, phone: form.phone, status: form.status },
        });
      }
      loadMembers();
      setModal(null);
    } catch (err: any) {
      if (err?.details) {
        setFieldErrors(err.details);
      }
      console.error("Save failed:", err);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch("/api/members", { method: "DELETE", token, body: { id } });
      loadMembers();
    } catch (err) { console.error("Delete failed:", err); }
  };

  const handleMemberPaymentSuccess = async (payment: { amount: number; category: string; reference: string; description: string }) => {
    if (!payingMember) return;
    try {
      // Record transaction
      await apiFetch("/api/transactions", {
        method: "POST",
        token,
        body: {
          type: "income",
          category: payment.category,
          amount: payment.amount,
          description: payment.description,
          date: new Date().toISOString().slice(0, 10),
          reference: payment.reference,
        },
      });

      // Update member balance locally & reload
      setMembers(prev => prev.map(m => m.id === payingMember.id ? {
        ...m,
        contributions: m.contributions + payment.amount,
        outstanding: Math.max(0, m.outstanding - payment.amount),
      } : m));
      loadMembers();
    } catch (e) {
      console.error("Member payment update failed:", e);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members & admins..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMembersReport(members, profile?.organization, profile?.name)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card text-foreground hover:bg-muted text-xs font-medium border border-border transition-colors cursor-pointer"
            title="Download member roster PDF"
          >
            <Download size={14} className="text-muted-foreground" />
            <span>Export Roster PDF</span>
          </button>
          <Btn onClick={openAddAdmin} variant="secondary"><Shield size={15} /> Add Admin</Btn>
          <Btn onClick={openAdd}><Plus size={15} /> Add Member</Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono">{members.filter(m => m.status === "active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Members</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono">{members.filter(m => m.status === "inactive").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Inactive Members</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono text-amber-700">
            {members.filter(m => m.outstanding > 0).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
              <Users size={22} />
            </div>
            <p className="text-sm font-semibold text-foreground">No members registered yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Your organization roster is empty. Click "+ Add Member" to register members and track contributions, or "Add Admin" to invite co-administrators.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Member", "Contact", "Joined", "Contributions", "Outstanding", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={cn("border-t border-border/50 hover:bg-muted/20 transition-colors", i % 2 !== 0 && "bg-muted/10")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={m.initials} size="sm" color={m.status === "active" ? "#0B4832" : "#9CA3AF"} />
                        <span className="font-medium text-foreground">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      <div>{m.email}</div>
                      <div>{m.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{fmtDate(m.joined)}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-emerald-700">{fmt(m.contributions)}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold">
                      <span className={m.outstanding > 0 ? "text-amber-700" : "text-muted-foreground"}>
                        {m.outstanding > 0 ? fmt(m.outstanding) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={m.status} variant={m.status === "active" ? "success" : "neutral"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {m.outstanding > 0 && (
                          <button
                            onClick={() => setPayingMember(m)}
                            title="Collect / Pay Dues via QR"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold cursor-pointer"
                          >
                            <CreditCard size={12} />
                            <span>Pay</span>
                          </button>
                        )}
                        <button
                          onClick={() =>
                            exportContributionCertificatePDF({
                              member: m,
                              organizationName: profile?.organization || "FundFlow Community Trust",
                            })
                          }
                          title="Download Annual Contribution Certificate (PDF)"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-colors cursor-pointer"
                        >
                          <FileCheck size={14} />
                        </button>
                        <button onClick={() => openEdit(m)} title="Edit Member" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} title="Delete Member" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "add" ? (form.role === "admin" ? "Add New Organization Admin" : "Add New Member") : "Edit Member"}>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Admin Adeyemi" error={fieldErrors.name} />
          <Input label="Email Address" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="user@example.com" error={fieldErrors.email} />
          <Input label="Phone Number" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+880 1700 000000" error={fieldErrors.phone} />
          {modal === "add" && (
            <>
              <Input label="Login Password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" placeholder="Set initial password" error={fieldErrors.password} />
              <Select label="Account Role" value={form.role} onChange={v => setForm(f => ({ ...f, role: v as "member" | "admin" }))}
                options={[{ value: "member", label: "Member (Standard Access)" }, { value: "admin", label: "Admin (Executive / Full Access)" }]} />
            </>
          )}
          <Select label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(null)} variant="ghost" className="flex-1 justify-center">Cancel</Btn>
            <Btn onClick={handleSave} className="flex-1 justify-center" disabled={saving}>{saving ? "Saving..." : <><Check size={14} /> Save</>}</Btn>
          </div>
        </div>
      </Modal>

      {payingMember && (
        <PaymentModal
          open={true}
          onClose={() => setPayingMember(null)}
          member={payingMember}
          defaultAmount={payingMember.outstanding || 1000}
          defaultCategory="Monthly Contribution"
          organizationName={profile?.organization || "FundFlow Community Trust"}
          onPaymentSuccess={handleMemberPaymentSuccess}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── INCOME ─────────────────────────── */
const INCOME_CATS = ["Monthly Contribution", "Donation", "Membership Fee", "Sponsorship", "Other"];

function IncomeView({ token, profile }: { token: string; profile?: ProfileInfo }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [modal, setModal] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "Monthly Contribution", date: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadTxs = useCallback(() => {
    apiFetch<Transaction[]>("/api/transactions", { token }).then(data => setTxs(data.filter(t => t.type === "income"))).catch(() => {});
  }, [token]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  const total = txs.reduce((s, t) => s + t.amount, 0);

  const handleAdd = async () => {
    const val = validateTransactionPayload({
      type: "income", category: form.category, amount: form.amount, description: form.description, date: form.date
    });
    if (!val.isValid) {
      setFieldErrors(val.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});

    const doc = {
      id: String(Date.now()), type: "income" as const, category: form.category,
      amount: Number(form.amount), description: form.description,
      date: form.date, reference: `INC-${Date.now()}`, status: "completed" as const
    };
    try {
      await apiFetch("/api/transactions", { method: "POST", token, body: doc });
      loadTxs();
    } catch (err: any) {
      if (err?.details) setFieldErrors(err.details);
      console.error(err);
      return;
    }
    setModal(false);
    setForm({ description: "", amount: "", category: "Monthly Contribution", date: "" });
  };

  const handlePaymentSuccess = async (payment: {
    amount: number;
    category: string;
    reference: string;
    description: string;
  }) => {
    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        token,
        body: {
          type: "income",
          category: payment.category,
          amount: payment.amount,
          description: payment.description,
          date: new Date().toISOString().slice(0, 10),
          reference: payment.reference,
        },
      });
      loadTxs();
    } catch (e) {
      console.error("Income payment registration failed:", e);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Total Income Recorded</p>
          <p className="text-2xl font-semibold font-mono text-emerald-700 mt-1">{fmt(total)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPayModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <QrCode size={15} className="text-emerald-700" />
            <span>Receive Payment via QR</span>
          </button>
          <Btn onClick={() => { setFieldErrors({}); setModal(true); }}>
            <Plus size={15} /> Record Income
          </Btn>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Income Records</h3>
          <button
            onClick={() => exportIncomeReport(txs, profile?.organization, profile?.name)}
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
        {txs.length === 0 ? (
          <div className="py-14 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
              <ArrowUpRight size={22} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">No income transactions recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click "Record Income" or "Receive Payment via QR" to register membership dues, donations, or sponsorships.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Description", "Category", "Reference", "Date", "Amount", "Status", "Receipt"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, i) => (
                  <tr key={tx.id} className={cn("border-t border-border/50 hover:bg-muted/20 transition-colors", i % 2 !== 0 && "bg-muted/10")}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{tx.description}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{tx.category}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{fmtDate(tx.date)}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-emerald-700">+{fmt(tx.amount)}</td>
                    <td className="px-5 py-3.5"><Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} /></td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() =>
                          exportPaymentReceiptPDF({
                            transactionId: tx.reference || `TXN-${tx.id}`,
                            payerName: "Organization Contributor",
                            amount: tx.amount,
                            category: tx.category,
                            paymentMethod: "Electronic Transfer",
                            paymentDate: tx.date,
                            organizationName: profile?.organization || "FundFlow Community Trust",
                            description: tx.description,
                          })
                        }
                        title="Download Money Receipt (PDF)"
                        className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Income">
        <div className="flex flex-col gap-4">
          <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="e.g. March member contributions" error={fieldErrors.description} />
          <Input label="Amount (Tk)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" error={fieldErrors.amount} />
          <Select label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}
            options={INCOME_CATS.map(c => ({ value: c, label: c }))} />
          <Input label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" error={fieldErrors.date} />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">Cancel</Btn>
            <Btn onClick={handleAdd} className="flex-1 justify-center"><Check size={14} /> Save</Btn>
          </div>
        </div>
      </Modal>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        organizationName={profile?.organization || "FundFlow Community Trust"}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

/* ─────────────────────────── EXPENSES ─────────────────────────── */
const EXPENSE_CATS = ["Operations", "Events", "Welfare", "Education", "Admin", "Other"];

function ExpensesView({ token, profile }: { token: string; profile?: ProfileInfo }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "Operations", date: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadTxs = useCallback(() => {
    apiFetch<Transaction[]>("/api/transactions", { token }).then(data => setTxs(data.filter(t => t.type === "expense"))).catch(() => {});
  }, [token]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  const total = txs.reduce((s, t) => s + t.amount, 0);

  const handleAdd = async () => {
    const val = validateTransactionPayload({
      type: "expense", category: form.category, amount: form.amount, description: form.description, date: form.date
    });
    if (!val.isValid) {
      setFieldErrors(val.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});

    const doc = {
      id: String(Date.now()), type: "expense" as const, category: form.category,
      amount: Number(form.amount), description: form.description,
      date: form.date, reference: `EXP-${Date.now()}`, status: "completed" as const
    };
    try {
      await apiFetch("/api/transactions", { method: "POST", token, body: doc });
      loadTxs();
    } catch (err: any) {
      if (err?.details) setFieldErrors(err.details);
      console.error(err);
      return;
    }
    setModal(false);
    setForm({ description: "", amount: "", category: "Operations", date: "" });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch("/api/transactions", { method: "DELETE", token, body: { id } });
      loadMembers: loadTxs();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Total Expenses Recorded</p>
          <p className="text-2xl font-semibold font-mono text-red-600 mt-1">{fmt(total)}</p>
        </div>
        <Btn onClick={() => { setFieldErrors({}); setModal(true); }}><Plus size={15} /> Record Expense</Btn>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Expense Records</h3>
          <button
            onClick={() => exportExpenseReport(txs, profile?.organization, EXPENSE_PIE, profile?.name)}
            className="flex items-center gap-1.5 text-xs text-red-700 hover:text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
        {txs.length === 0 ? (
          <div className="py-14 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
              <TrendingDown size={22} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">No expenses recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click "Record Expense" above to log official fund disbursements, operational costs, or event budgets.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Description", "Category", "Reference", "Date", "Amount", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, i) => (
                  <tr key={tx.id} className={cn("border-t border-border/50 hover:bg-muted/20 transition-colors", i % 2 !== 0 && "bg-muted/10")}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{tx.description}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{tx.category}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{fmtDate(tx.date)}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-red-600">-{fmt(tx.amount)}</td>
                    <td className="px-5 py-3.5"><Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(tx.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Expense">
        <div className="flex flex-col gap-4">
          <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="e.g. Office supplies" error={fieldErrors.description} />
          <Input label="Amount (Tk)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" error={fieldErrors.amount} />
          <Select label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}
            options={EXPENSE_CATS.map(c => ({ value: c, label: c }))} />
          <Input label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" error={fieldErrors.date} />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">Cancel</Btn>
            <Btn onClick={handleAdd} className="flex-1 justify-center"><Check size={14} /> Save</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── REPORTS ─────────────────────────── */
function ReportsView({ profile }: { profile?: ProfileInfo }) {
  const [tab, setTab] = useState<"overview" | "income" | "expenses">("overview");

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
          {(["overview", "income", "expenses"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportOrganizationPDF({
            organizationName: profile?.organization || "FundFlow Community Trust",
            reportTitle: "Financial Performance & Analytics Audit",
            reportSubtitle: "Multi-period trend analysis and category distribution metrics",
            generatedBy: profile?.name || "System Administrator",
            includeKPIs: true,
            includeMonthlyTrend: true,
            includeExpenseCategories: true,
            includeMembers: false,
            includeTransactions: false,
            includeAnnouncements: false,
            includeSignatures: true,
            monthlyData: MONTHLY_DATA,
            expensePie: EXPENSE_PIE,
          })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Download size={14} />
          <span>Export Analytics PDF</span>
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Net Balance", value: fmt(1874500), color: "text-foreground" },
              { label: "Total Income (YTD)", value: fmt(1671000), color: "text-emerald-700" },
              { label: "Total Expenses (YTD)", value: fmt(579500), color: "text-red-600" },
              { label: "Savings Rate", value: "65.3%", color: "text-indigo-700" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-semibold font-mono mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>7-Month Income vs Expense Trend</h3>
            <p className="text-xs text-muted-foreground mb-5">Monthly comparison for Oct 2023 – Apr 2024</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14C768" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14C768" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B4832" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0B4832" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Outfit" }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#14C768" fill="url(#incomeGrad)" strokeWidth={2} dot={{ r: 4, fill: "#14C768" }} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#0B4832" fill="url(#expenseGrad)" strokeWidth={2} dot={{ r: 4, fill: "#0B4832" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === "income" && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>Monthly Income Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">Income by category per month</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
              <Bar dataKey="income" name="Total Income" fill="#14C768" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>Monthly Expenses</h3>
            <p className="text-xs text-muted-foreground mb-5">Monthly expense totals</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
                <Bar dataKey="expenses" name="Expenses" fill="#0B4832" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>Expense by Category</h3>
            <p className="text-xs text-muted-foreground mb-5">Distribution for current period</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={EXPENSE_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {EXPENSE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-y-2 mt-3">
              {EXPENSE_PIE.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-mono font-medium text-foreground ml-auto">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── ANNOUNCEMENTS ─────────────────────────── */
function AnnouncementsView({ role, token }: { role: Role; token: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", priority: "medium" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadAnnouncements = useCallback(() => {
    apiFetch<Announcement[]>("/api/announcements", { token }).then(setAnnouncements).catch(() => {});
  }, [token]);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const handlePost = async () => {
    const val = validateAnnouncementPayload(form);
    if (!val.isValid) {
      setFieldErrors(val.errors as Record<string, string>);
      return;
    }
    setFieldErrors({});

    const doc = {
      id: String(Date.now()), title: form.title, body: form.body,
      date: new Date().toISOString().slice(0, 10),
      priority: form.priority as "high" | "medium" | "low",
      author: "Admin Office"
    };
    try {
      await apiFetch("/api/announcements", { method: "POST", token, body: doc });
      loadAnnouncements();
    } catch (err: any) {
      if (err?.details) setFieldErrors(err.details);
      console.error(err);
      return;
    }
    setModal(false);
    setForm({ title: "", body: "", priority: "medium" });
  };

  const priorityVariant: Record<string, "danger" | "warning" | "neutral"> = {
    high: "danger", medium: "warning", low: "neutral"
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      {role === "admin" && (
        <div className="flex justify-end">
          <Btn onClick={() => { setFieldErrors({}); setModal(true); }}><Plus size={15} /> Post Announcement</Btn>
        </div>
      )}
      {announcements.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-14 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
            <Bell size={22} />
          </div>
          <p className="text-sm font-semibold text-foreground">No announcements posted yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Keep your members updated with organizational notices, meeting schedules, and policy updates.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>{a.title}</h3>
                <Badge label={a.priority} variant={priorityVariant[a.priority]} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.body}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1.5"><User size={12} /> {a.author}</span>
                <span className="font-mono">{fmtDate(a.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Post Announcement">
        <div className="flex flex-col gap-4">
          <Input label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Announcement title" error={fieldErrors.title} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Message</label>
            <textarea
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Write your announcement here..."
              rows={4}
              className={cn(
                "px-3 py-2.5 rounded-lg border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none transition-all",
                fieldErrors.body ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-ring"
              )}
            />
            {fieldErrors.body && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5 font-medium">
                <AlertCircle size={12} /> {fieldErrors.body}
              </p>
            )}
          </div>
          <Select label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))}
            options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">Cancel</Btn>
            <Btn onClick={handlePost} className="flex-1 justify-center"><Check size={14} /> Post</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── AI ANALYSIS ─────────────────────────── */
interface HealthFactor {
  name: string;
  score: number;
}

interface RiskItem {
  risk: string;
  severity: "high" | "medium" | "low";
  impact: string;
  mitigation: string;
}

interface SpendingTrends {
  insights: string[];
  topCategory?: string;
  topCategoryPercent?: number;
  monthOverMonthChange?: number;
  trend?: "increasing" | "decreasing" | "stable";
}

interface RevenueSource {
  name: string;
  percent: number;
  trend: "growing" | "stable" | "declining";
}

interface RevenueDiversification {
  sources: RevenueSource[];
  diversificationScore: number;
  insight: string;
}

interface CashFlow {
  insights: string[];
  monthlyAvgSurplus: number;
  consecutivePositiveMonths: number;
  runwayMonths: number;
}

interface Forecast {
  currentBalance: number;
  predicted30Day: number;
  predicted90Day?: number;
  growthPercent30: number;
  growthPercent90?: number;
  confidence: number;
  scenarioBest?: number;
  scenarioWorst?: number;
}

interface AnomalyItem {
  type: string;
  description: string;
  severity: "warning" | "info" | "danger";
}

interface RecommendationItem {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  estimatedImpact?: string;
}

interface MemberAnalysis {
  totalContributions: number;
  outstandingBalance: number;
  rank: number;
  totalMembers: number;
  percentile: number;
  contributionTrend?: string;
  personalRecommendations: Array<{ icon?: string; text: string }>;
}

interface StructuredAnalysis {
  healthScore?: {
    score: number;
    label: string;
    factors?: HealthFactor[];
  };
  riskMatrix?: RiskItem[];
  spendingTrends?: SpendingTrends;
  revenueDiversification?: RevenueDiversification;
  cashFlow?: CashFlow;
  forecast?: Forecast;
  anomalies?: AnomalyItem[];
  recommendations?: RecommendationItem[];
  memberAnalysis?: MemberAnalysis;
}

const DEFAULT_ADMIN_STRUCTURED: StructuredAnalysis = {
  healthScore: {
    score: 82,
    label: "Strong",
    factors: [
      { name: "Income Stability", score: 88 },
      { name: "Expense Ratio", score: 74 },
      { name: "Reserve Coverage", score: 70 },
      { name: "Collection Rate", score: 94 },
    ],
  },
  riskMatrix: [
    {
      risk: "Outstanding dues concentration",
      severity: "medium",
      impact: "Tk 85,000 pending from 3 inactive members",
      mitigation: "Implement automated payment reminder sequence 7 days before due date",
    },
    {
      risk: "Single-sponsor revenue dependency",
      severity: "high",
      impact: "38% of Q1 revenue originates from PrimeBank sponsorship",
      mitigation: "Onboard 2 additional corporate partners to reduce single-source risk",
    },
  ],
  spendingTrends: {
    insights: [
      "Event venue & logistics spending increased 34% QoQ due to annual summit",
      "Admin overhead maintained below 12.5% target benchmark",
      "Welfare disbursements tracked proportionately with member growth (+14%)",
    ],
    topCategory: "Events",
    topCategoryPercent: 31.2,
    monthOverMonthChange: 5.4,
    trend: "increasing",
  },
  revenueDiversification: {
    sources: [
      { name: "Monthly Contributions", percent: 52, trend: "stable" },
      { name: "Corporate Sponsorship", percent: 28, trend: "growing" },
      { name: "Donations", percent: 14, trend: "declining" },
      { name: "Registration Fees", percent: 6, trend: "stable" },
    ],
    diversificationScore: 76,
    insight: "Moderate revenue balance. Increasing recurring member contributions will enhance multi-year resilience.",
  },
  cashFlow: {
    insights: [
      "Net positive operating cash flow maintained for 7 consecutive months",
      "Average net surplus: Tk 162,400 / month",
      "Liquid reserves provide 3.8 months of total operational runway",
    ],
    monthlyAvgSurplus: 162400,
    consecutivePositiveMonths: 7,
    runwayMonths: 3.8,
  },
  forecast: {
    currentBalance: 1874500,
    predicted30Day: 2043000,
    predicted90Day: 2380000,
    growthPercent30: 8.9,
    growthPercent90: 27.0,
    confidence: 86,
    scenarioBest: 2510000,
    scenarioWorst: 1680000,
  },
  anomalies: [
    {
      type: "spike",
      description: "March event expenses spiked 48% above 3-month rolling average",
      severity: "warning",
    },
    {
      type: "pattern",
      description: "Member contribution processing window delayed by +3.2 days in April",
      severity: "info",
    },
  ],
  recommendations: [
    {
      priority: "high",
      title: "Build Emergency Reserve Fund",
      description: "Increase contribution allocation by 8% to achieve 6-month operational reserve",
      estimatedImpact: "Tk 576,000 added to capital buffer",
    },
    {
      priority: "high",
      title: "Corporate Partnership Diversification",
      description: "Engage two new enterprise sponsors for Q3 community initiatives",
      estimatedImpact: "Reduces revenue volatility risk by 35%",
    },
    {
      priority: "medium",
      title: "Annual Billing Vendor Discounts",
      description: "Switch software & utility subscriptions to annual prepaid plans",
      estimatedImpact: "Tk 34,000 direct annual savings",
    },
    {
      priority: "medium",
      title: "Automate Dues Collection Reminders",
      description: "Deploy automated SMS and email notifications for pending invoices",
      estimatedImpact: "Reduces outstanding collection cycle by 50%",
    },
  ],
};

const DEFAULT_MEMBER_STRUCTURED: StructuredAnalysis = {
  memberAnalysis: {
    totalContributions: 124000,
    outstandingBalance: 0,
    rank: 3,
    totalMembers: 8,
    percentile: 75.0,
    contributionTrend: "consistent",
    personalRecommendations: [
      { icon: "check", text: "All dues fully settled. Your account is in excellent standing!" },
      { icon: "target", text: "Increasing monthly contribution by Tk 2,000 places you in the top 15% of fund contributors." },
      { icon: "bell", text: "Next contribution window opens May 1st. Early payment maintains your 100% timeliness streak." },
    ],
  },
};

function clientSafeParseJson(raw: any): StructuredAnalysis | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as StructuredAnalysis;
  let text = String(raw).trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue repair
  }

  const start = text.indexOf("{");
  if (start === -1) return null;

  let end = text.lastIndexOf("}");
  while (end > start) {
    const candidate = text.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      end = text.lastIndexOf("}", end - 1);
    }
  }

  try {
    let repaired = text;
    const lastComma = repaired.lastIndexOf(",");
    if (lastComma > start) {
      repaired = repaired.substring(0, lastComma);
    }
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += "}";
    }
    return JSON.parse(repaired);
  } catch (e) {
    return null;
  }
}

function MarkdownFallback({ text }: { text: string }) {
  // If raw string starts with JSON brackets, clean up quotes and syntax characters
  let cleanText = text.trim();
  if (cleanText.startsWith("{") || cleanText.startsWith("[")) {
    cleanText = cleanText
      .replace(/["{}[\],]/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  const lines = cleanText.split("\n");
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
          return (
            <h3 key={idx} className="font-semibold text-foreground text-base mt-3 mb-1" style={{ fontFamily: "Fraunces, serif" }}>
              {trimmed.replace(/^#+\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>{trimmed.replace(/^[-*•]\s*/, "")}</span>
            </div>
          );
        }
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

function AIView({ role, token }: { role: Role; token: string }) {
  const [loading, setLoading] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [structured, setStructured] = useState<StructuredAnalysis | null>(null);
  const [_summary, setSummary] = useState<{
    members: { total_members: number; total_contributions: string; total_outstanding: string };
    income: { total_income: string; income_count: number };
    expenses: { total_expenses: string; expense_count: number };
  } | null>(null);
  const [error, setError] = useState("");

  const handleAnalyse = async () => {
    setLoading(true);
    setError("");
    setAnalysisText("");
    setStructured(null);
    setSummary(null);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role, timePeriod: "last 6 months" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Analysis request failed.");
      }

      const data = await response.json();
      let parsedStruct = data.structured || clientSafeParseJson(data.analysis);

      setAnalysisText(data.analysis ?? "");
      setStructured(parsedStruct || (role === "admin" ? DEFAULT_ADMIN_STRUCTURED : DEFAULT_MEMBER_STRUCTURED));
      setSummary(data.summary ?? null);
      setAnalysed(true);
    } catch (err) {
      console.warn("API request failed, using structured fallback view:", err);
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setStructured(role === "admin" ? DEFAULT_ADMIN_STRUCTURED : DEFAULT_MEMBER_STRUCTURED);
      setAnalysed(true);
    } finally {
      setLoading(false);
    }
  };


  const currentStructured = structured || (role === "admin" ? DEFAULT_ADMIN_STRUCTURED : DEFAULT_MEMBER_STRUCTURED);
  const health = currentStructured.healthScore || DEFAULT_ADMIN_STRUCTURED.healthScore!;

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-border relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #14C768 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-accent" />
              <span className="text-accent text-sm font-medium">AI Financial Intelligence Engine</span>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "Fraunces, serif" }}>
              {role === "admin" ? "Executive Intelligence & Risk Dashboard" : "Personal Contribution & Financial Health"}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {analysed ? "Dynamic analysis complete — generated from real-time database aggregations" : "Click to run AI risk analysis, cash flow forecasts, and budget recommendations"}
            </p>
          </div>
          <button onClick={handleAnalyse} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60 flex-shrink-0 cursor-pointer">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing...
              </>
            ) : (
              <><Sparkles size={15} /> {analysed ? "Re-analyse" : "Generate Analysis"}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Live AI Service Notice</p>
            <p className="text-xs mt-0.5">{error} — displaying cached intelligence structures.</p>
          </div>
          <Badge label="Fallback Active" variant="warning" />
        </div>
      )}

      {/* Raw text fallback banner if non-JSON output returned */}
      {analysed && !structured && analysisText && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-accent" />
            <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>AI Analysis Output</h3>
          </div>
          <MarkdownFallback text={analysisText} />
        </div>
      )}

      {!analysed && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/40 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-emerald-700" />
          </div>
          <h3 className="font-semibold text-foreground text-lg mb-2" style={{ fontFamily: "Fraunces, serif" }}>Ready to generate AI financial intelligence</h3>
          <p className="text-muted-foreground text-sm max-w-md">Click "Generate Analysis" above to evaluate fund health, compute cash flow forecasts, identify financial anomalies, and generate actionable recommendations.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-foreground font-medium text-base mb-1">Synthesizing Database Aggregations & AI Models...</p>
          <p className="text-muted-foreground text-xs">Computing risk matrix, revenue diversification, runway metrics, and 90-day balance forecasts.</p>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {analysed && !loading && role === "admin" && (
        <div className="flex flex-col gap-6">

          {/* Section 1: Financial Health Score */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-lg" style={{ fontFamily: "Fraunces, serif" }}>Financial Health Score</h3>
                  <Badge label={health.label} variant={health.score >= 80 ? "success" : health.score >= 60 ? "warning" : "danger"} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Multi-factor composite index based on income stability, reserves, and collection rates</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-semibold font-mono text-emerald-700">{health.score}<span className="text-lg text-muted-foreground font-normal">/100</span></p>
              </div>
            </div>

            {/* Health Score Bar */}
            <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-accent to-emerald-400 transition-all duration-1000"
                style={{ width: `${health.score}%` }} />
            </div>

            {/* Health Factors Breakdown */}
            {health.factors && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
                {health.factors.map((factor, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{factor.name}</span>
                      <span className="font-mono font-semibold text-foreground">{factor.score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${factor.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Risk Matrix */}
          {currentStructured.riskMatrix && currentStructured.riskMatrix.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-amber-600" />
                <h3 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>AI Financial Risk Matrix</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {currentStructured.riskMatrix.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge label={item.severity.toUpperCase() + " RISK"} variant={item.severity === "high" ? "danger" : item.severity === "medium" ? "warning" : "info"} />
                        <span className="text-xs font-mono text-muted-foreground">Impact: {item.impact}</span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.risk}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground bg-card p-2.5 rounded-lg border border-border">
                      <strong className="text-foreground">Mitigation: </strong>{item.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3 & 4: Spending Trends & Revenue Diversification */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Spending Patterns */}
            {currentStructured.spendingTrends && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-indigo-600" />
                      <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>Spending Trend Insights</h4>
                    </div>
                    {currentStructured.spendingTrends.topCategory && (
                      <Badge label={`Top: ${currentStructured.spendingTrends.topCategory} (${currentStructured.spendingTrends.topCategoryPercent}%)`} variant="info" />
                    )}
                  </div>
                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    {currentStructured.spendingTrends.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {currentStructured.spendingTrends.monthOverMonthChange !== undefined && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Month-over-Month Change</span>
                    <span className={cn("font-mono font-semibold flex items-center gap-1", currentStructured.spendingTrends.trend === "increasing" ? "text-amber-600" : "text-emerald-600")}>
                      {currentStructured.spendingTrends.trend === "increasing" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {currentStructured.spendingTrends.monthOverMonthChange}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Revenue Diversification */}
            {currentStructured.revenueDiversification && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-emerald-600" />
                      <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>Revenue Diversification</h4>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-700">
                      Score: {currentStructured.revenueDiversification.diversificationScore}/100
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    {currentStructured.revenueDiversification.sources.map((src, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">{src.name}</span>
                          <span className="text-muted-foreground font-mono">{src.percent}% ({src.trend})</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${src.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-3 border-t border-border">{currentStructured.revenueDiversification.insight}</p>
              </div>
            )}
          </div>

          {/* Section 5 & 6: Cash Flow & Balance Forecast */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Cash Flow */}
            {currentStructured.cashFlow && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={18} className="text-emerald-600" />
                    <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>Cash Flow & Runway Analysis</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <p className="text-xs text-emerald-800">Monthly Avg Surplus</p>
                      <p className="text-lg font-semibold font-mono text-emerald-900 mt-0.5">Tk {currentStructured.cashFlow.monthlyAvgSurplus.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <p className="text-xs text-indigo-800">Operational Runway</p>
                      <p className="text-lg font-semibold font-mono text-indigo-900 mt-0.5">{currentStructured.cashFlow.runwayMonths} Months</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {currentStructured.cashFlow.insights.map((ins, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-600 mt-1 flex-shrink-0" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Forecast */}
            {currentStructured.forecast && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-amber-600" />
                      <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>30 & 90-Day Balance Forecast</h4>
                    </div>
                    <Badge label={`Confidence: ${currentStructured.forecast.confidence}%`} variant="success" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Predicted 30-Day</p>
                      <p className="text-xl font-semibold font-mono text-emerald-700 mt-1">Tk {currentStructured.forecast.predicted30Day.toLocaleString()}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">+{currentStructured.forecast.growthPercent30}% growth</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Predicted 90-Day</p>
                      <p className="text-xl font-semibold font-mono text-emerald-700 mt-1">Tk {(currentStructured.forecast.predicted90Day || Math.round(currentStructured.forecast.predicted30Day * 1.15)).toLocaleString()}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">+{currentStructured.forecast.growthPercent90 || 25}% projected</p>
                    </div>
                  </div>
                </div>
                {currentStructured.forecast.scenarioBest && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-3 border-t border-border font-mono">
                    <span>Worst Case: Tk {currentStructured.forecast.scenarioWorst?.toLocaleString()}</span>
                    <span>Best Case: Tk {currentStructured.forecast.scenarioBest?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 7: Anomaly Detection */}
          {currentStructured.anomalies && currentStructured.anomalies.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h4 className="font-semibold text-foreground text-base mb-3" style={{ fontFamily: "Fraunces, serif" }}>Automated Anomaly Detection</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {currentStructured.anomalies.map((anom, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <AlertCircle size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-900 uppercase font-mono">{anom.type}</span>
                        <Badge label={anom.severity} variant="warning" />
                      </div>
                      <p className="text-xs text-amber-900 mt-1">{anom.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: Actionable Recommendations */}
          {currentStructured.recommendations && currentStructured.recommendations.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary" />
                <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>AI Strategic Recommendations</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {currentStructured.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge label={rec.priority.toUpperCase() + " PRIORITY"} variant={rec.priority === "high" ? "danger" : rec.priority === "medium" ? "warning" : "info"} />
                        {rec.estimatedImpact && (
                          <span className="text-xs font-mono text-emerald-700 font-medium">{rec.estimatedImpact}</span>
                        )}
                      </div>
                      <h5 className="font-semibold text-foreground text-sm mb-1">{rec.title}</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MEMBER DASHBOARD */}
      {analysed && !loading && role === "member" && currentStructured.memberAnalysis && (
        <div className="flex flex-col gap-6">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground">Your Total Contributions</p>
              <p className="text-3xl font-semibold font-mono text-emerald-700 mt-1">
                Tk {currentStructured.memberAnalysis.totalContributions.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Verified on database</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground">Outstanding Dues</p>
              <p className="text-3xl font-semibold font-mono text-emerald-700 mt-1">
                Tk {currentStructured.memberAnalysis.outstandingBalance.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check size={14} /> Fully Paid & Up to Date</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground">Contributor Standing</p>
              <p className="text-3xl font-semibold font-mono text-foreground mt-1">
                #{currentStructured.memberAnalysis.rank} <span className="text-sm font-normal text-muted-foreground">of {currentStructured.memberAnalysis.totalMembers}</span>
              </p>
              <p className="text-xs text-indigo-600 mt-1 font-medium">Top {100 - currentStructured.memberAnalysis.percentile}% contributor rank</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-accent" />
              <h4 className="font-semibold text-foreground text-base" style={{ fontFamily: "Fraunces, serif" }}>Personalized Member Guidance</h4>
            </div>
            <div className="flex flex-col gap-3">
              {currentStructured.memberAnalysis.personalRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-emerald-700" />
                  </div>
                  <p className="text-sm text-foreground">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────── MEMBER HOME ─────────────────────────── */
function MemberHomeView({ token, userEmail }: { token: string; userEmail: string }) {
  const [me, setMe] = useState<Member | null>(null);
  const [myTxs, setMyTxs] = useState<Transaction[]>([]);
  const [announcements, setAnn] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payModalOpen, setPayModalOpen] = useState(false);

  useEffect(() => {
    apiFetch<Member[]>("/api/members", { token }).then(data => {
      setMembers(data);
      const found = data.find(m => m.email === userEmail);
      setMe(found || data[0] || null);
    }).catch(() => {});
    apiFetch<Transaction[]>("/api/transactions", { token }).then(data => {
      setTransactions(data);
      setMyTxs(data.filter(t => t.type === "income" && t.category === "Monthly Contribution").slice(0, 4));
    }).catch(() => {});
    apiFetch<Announcement[]>("/api/announcements", { token }).then(setAnn).catch(() => {});
  }, [token, userEmail]);

  if (!me) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const activeMembers = members.filter(m => m.status === "active").length;

  const handlePaymentSuccess = (payment: {
    amount: number;
    category: string;
    reference: string;
    method: string;
    description: string;
  }) => {
    const newTx: Transaction = {
      id: String(Date.now()),
      type: "income",
      category: payment.category,
      amount: payment.amount,
      description: payment.description,
      date: new Date().toISOString().slice(0, 10),
      reference: payment.reference,
      status: "completed",
    };

    setMe(prev => prev ? ({
      ...prev,
      contributions: prev.contributions + payment.amount,
      outstanding: Math.max(0, prev.outstanding - payment.amount),
    }) : null);

    setMyTxs(prev => [newTx, ...prev]);
    setTransactions(prev => [newTx, ...prev]);

    // Persist to backend
    apiFetch("/api/transactions", {
      method: "POST",
      token,
      body: {
        type: "income",
        category: payment.category,
        amount: payment.amount,
        description: payment.description,
        date: new Date().toISOString().slice(0, 10),
        reference: payment.reference,
      },
    }).catch(() => {});
  };

  const handleDownloadCertificate = () => {
    if (!me) return;
    exportContributionCertificatePDF({
      member: me,
      organizationName: "FundFlow Community Trust",
      year: new Date().getFullYear().toString(),
      totalContributions: me.contributions,
    });
  };

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Welcome & Certificate action */}
      <div className="rounded-2xl p-6 border border-border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 60%, #14C768 0%, transparent 55%)" }} />
        <div className="relative z-10 flex items-center gap-4">
          <Avatar initials={me.initials} size="lg" color="#14C768" />
          <div>
            <p className="text-white/60 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "Fraunces, serif" }}>{me.name}</h2>
            <p className="text-white/60 text-xs mt-1">Member since {fmtDate(me.joined)}</p>
          </div>
        </div>

        <button
          onClick={handleDownloadCertificate}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-sm transition-all cursor-pointer w-fit"
        >
          <FileCheck size={15} className="text-emerald-400" />
          <span>Annual Contribution Certificate (PDF)</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">My Contributions</p>
          <p className="text-xl font-semibold font-mono text-emerald-700 mt-1">{fmt(me.contributions)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className={cn("text-xl font-semibold font-mono mt-1", me.outstanding > 0 ? "text-amber-700" : "text-muted-foreground")}>
            {me.outstanding > 0 ? fmt(me.outstanding) : "—"}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Account Status</p>
          <div className="mt-1.5"><Badge label={me.status} variant={me.status === "active" ? "success" : "neutral"} /></div>
        </div>
      </div>

      {/* Fund Summary */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold mb-4" style={{ fontFamily: "Fraunces, serif" }}>Organization Fund Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Fund Balance", value: fmt(totalIncome - totalExpenses), color: "text-foreground" },
            { label: "Active Members", value: `${activeMembers} of ${members.length}`, color: "text-foreground" },
            { label: "Total Income (YTD)", value: fmt(totalIncome), color: "text-emerald-700" },
            { label: "Total Expenses (YTD)", value: fmt(totalExpenses), color: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-base font-semibold font-mono mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Donate / Payment Section */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-5 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                INSTANT RECONCILE
              </span>
              <p className="text-xs font-semibold text-emerald-800">Direct QR & Mobile Checkout</p>
            </div>
            <h3 className="font-semibold text-foreground text-lg mt-1" style={{ fontFamily: "Fraunces, serif" }}>
              Donate or pay your monthly dues
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Support the organization securely with a quick payment via bKash, Nagad, Rocket, or Card. Instant digital receipt and live ledger reconciliation.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 min-w-[240px] shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Amount to pay:</span>
              <span className="font-mono font-bold text-emerald-800">
                {me.outstanding > 0 ? fmt(me.outstanding) : "Tk 1,000"}
              </span>
            </div>
            <p className="text-2xl font-semibold font-mono text-foreground mt-1">
              {me.outstanding > 0 ? fmt(me.outstanding) : "Tk 1,000"}
            </p>
            <button
              onClick={() => setPayModalOpen(true)}
              className="mt-3 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode size={14} />
              <span>Pay Now via QR / Wallet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Recent Contribution Activity</h3>
          <span className="text-xs text-muted-foreground font-mono">{myTxs.length} records</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {myTxs.map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">{fmtDate(tx.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-emerald-700">+{fmt(tx.amount)}</span>
                <button
                  onClick={() =>
                    exportPaymentReceiptPDF({
                      transactionId: tx.reference || `TXN-${tx.id}`,
                      payerName: me.name,
                      payerEmail: me.email,
                      payerPhone: me.phone,
                      amount: tx.amount,
                      category: tx.category,
                      paymentMethod: "Electronic Transfer",
                      paymentDate: tx.date,
                      description: tx.description,
                      remainingOutstanding: me.outstanding,
                    })
                  }
                  title="Download Electronic Receipt Voucher (PDF)"
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Download size={11} />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Latest Announcements</h3>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {announcements.slice(0, 2).map(a => (
            <div key={a.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <Badge label={a.priority} variant={a.priority === "high" ? "danger" : a.priority === "medium" ? "warning" : "neutral"} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        member={me}
        defaultAmount={me.outstanding > 0 ? me.outstanding : 1000}
        defaultCategory="Monthly Contribution"
        organizationName="FundFlow Community Trust"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

/* ─────────────────────────── APP SHELL ─────────────────────────── */
const VIEW_TITLES: Partial<Record<View, { title: string; subtitle: string }>> = {
  dashboard: { title: "Dashboard", subtitle: "Organization financial overview" },
  members: { title: "Member Management", subtitle: "Manage organization members" },
  income: { title: "Fund Income", subtitle: "Track all income sources" },
  expenses: { title: "Expenses", subtitle: "Record and categorize expenses" },
  reports: { title: "Reports & Analytics", subtitle: "Financial performance insights" },
  announcements: { title: "Announcements", subtitle: "Organization-wide communications" },
  ai: { title: "AI Financial Analysis", subtitle: "Powered by intelligent insights" },
  "member-home": { title: "My Dashboard", subtitle: "Your personal financial overview" },
};

function AppShell({
  role,
  token,
  userName,
  userEmail,
  orgName,
  onLogout,
}: {
  role: Role;
  token: string;
  userName: string;
  userEmail: string;
  orgName?: string;
  onLogout: () => void;
}) {
  const defaultView: View = role === "admin" ? "dashboard" : "member-home";
  const [view, setView] = useState<View>(defaultView);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const meta = VIEW_TITLES[view] || { title: "FundFlow", subtitle: "" };

  const [profile, setProfile] = useState<ProfileInfo>({
    name: userName,
    email: userEmail,
    phone: "+880 1700 000000",
    organization: orgName || "FundFlow Community Trust",
    role,
    initials: userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
  });

  const [profileForm, setProfileForm] = useState({ ...profile });

  const handleSaveProfile = () => {
    const initials = profileForm.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    setProfile({ ...profileForm, initials });
    setEditProfileOpen(false);
  };

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView token={token} profile={profile} />;
      case "members": return <MembersView token={token} profile={profile} />;
      case "income": return <IncomeView token={token} profile={profile} />;
      case "expenses": return <ExpensesView token={token} profile={profile} />;
      case "reports": return <ReportsView profile={profile} />;
      case "announcements": return <AnnouncementsView role={role} token={token} />;
      case "ai": return <AIView role={role} token={token} />;
      case "member-home": return <MemberHomeView token={token} userEmail={userEmail} />;
      default: return <DashboardView token={token} profile={profile} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "Outfit, sans-serif" }}>
      <Sidebar view={view} onView={setView} role={role} onLogout={onLogout}
        sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-20">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          profile={profile}
          onEditProfile={() => { setProfileForm({ ...profile }); setEditProfileOpen(true); }}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Profile">
        <div className="flex flex-col gap-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <Avatar initials={profileForm.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "??"} size="lg" />
            <div>
              <p className="text-sm font-medium text-foreground">{profileForm.name || "Your Name"}</p>
              <p className="text-xs text-muted-foreground">{profileForm.email}</p>
              <div className="mt-1"><Badge label={role} variant={role === "admin" ? "info" : "success"} /></div>
            </div>
          </div>
          <Input label="Full Name" value={profileForm.name} onChange={v => setProfileForm(f => ({ ...f, name: v }))} placeholder="Your full name" />
          <Input label="Email Address" value={profileForm.email} onChange={v => setProfileForm(f => ({ ...f, email: v }))} type="email" placeholder="you@example.com" />
          <Input label="Phone Number" value={profileForm.phone} onChange={v => setProfileForm(f => ({ ...f, phone: v }))} placeholder="+880 1700 000000" />
          <Input label="Organization" value={profileForm.organization} onChange={v => setProfileForm(f => ({ ...f, organization: v }))} placeholder="Organization name" />
          <div className="flex gap-3 mt-1">
            <Btn onClick={() => setEditProfileOpen(false)} variant="ghost" className="flex-1 justify-center">Cancel</Btn>
            <Btn onClick={handleSaveProfile} className="flex-1 justify-center"><Check size={14} /> Save Changes</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── ROOT ─────────────────────────── */
export default function App() {
  const [page, setPage] = useState<AppPage>("landing");
  const [auth, setAuth] = useState<{
    role: Role;
    token: string;
    name: string;
    email: string;
    orgName?: string;
    orgId?: string;
  } | null>(null);

  // Restore auth from localStorage on mount
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setAuth(stored);
      setPage("app");
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
    setPage("landing");
  };

  if (page === "landing") return <LandingPage onGetStarted={() => setPage("login")} />;
  if (page === "login" || !auth)
    return (
      <LoginView
        onLogin={(role, token, name, email, orgName, orgId) => {
          setAuth({ role, token, name, email, orgName, orgId });
          setPage("app");
        }}
        onBack={() => setPage("landing")}
      />
    );
  return (
    <AppShell
      role={auth.role}
      token={auth.token}
      userName={auth.name}
      userEmail={auth.email}
      orgName={auth.orgName}
      onLogout={handleLogout}
    />
  );
}
