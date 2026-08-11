import { useState } from "react";
import { AlertCircle, ArrowRight, Wallet } from "lucide-react";
import { Btn, Input } from "../components/shared";
import type { Role } from "../types";

export function LoginView({ onLogin, onBack }: { onLogin: (role: Role) => void; onBack?: () => void }) {
  const [email, setEmail] = useState("admin@fundflow.org");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (email === "admin@fundflow.org") onLogin("admin");
    else if (email === "member@fundflow.org") onLogin("member");
    else { setError("Invalid credentials. Try admin@fundflow.org or member@fundflow.org"); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #09182A 0%, #0B2D1C 60%, #0B4832 100%)" }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16"><div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center"><Wallet size={18} className="text-white" /></div><span className="text-white text-xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span></div>
          <h1 className="text-5xl font-semibold leading-tight text-white mb-6" style={{ fontFamily: "Fraunces, serif" }}>Smart fund<br />management for<br /><em className="not-italic text-accent">every organization.</em></h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">Digitize your finances, track contributions, and gain AI-powered insights — all in one secure platform.</p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">{[{ label: "Total Members", value: "247" }, { label: "Funds Managed", value: "Tk 4.2M" }, { label: "Accuracy Rate", value: "99.8%" }].map(s => <div key={s.label} className="rounded-xl p-4 border border-white/10 bg-white/5"><p className="text-white text-xl font-semibold font-mono">{s.value}</p><p className="text-white/50 text-xs mt-1">{s.label}</p></div>)}</div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-32 -left-16 w-64 h-64 rounded-full bg-accent/5 blur-2xl" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-10"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Wallet size={16} className="text-white" /></div><span className="text-foreground font-semibold" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span></div>{onBack && <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowRight size={14} className="rotate-180" /> Back to home</button>}</div>
          <h2 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account to continue</p>
          <div className="flex flex-col gap-4">
            <Input label="Email address" value={email} onChange={setEmail} type="email" placeholder="you@fundflow.org" />
            <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle size={14} /> {error}</div>}
            <Btn onClick={handleSubmit} className="w-full justify-center mt-1">Sign In</Btn>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-muted border border-border text-xs text-muted-foreground"><p className="font-medium text-foreground mb-2">Demo credentials</p><p>Admin: <span className="font-mono text-foreground">admin@fundflow.org</span></p><p>Member: <span className="font-mono text-foreground">member@fundflow.org</span></p><p className="mt-1">Password: <span className="font-mono text-foreground">password</span></p></div>
        </div>
      </div>
    </div>
  );
}
