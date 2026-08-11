import { ArrowRight, Activity, Check, Lock, Shield, Sparkles, Star, TrendingDown, TrendingUp, Users, Wallet, BarChart2, LayoutDashboard } from "lucide-react";

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
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
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-6xl" style={{ backdropFilter: "blur(14px)" }}>
        <div className="px-6 h-16 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-slate-950/95 via-emerald-950/95 to-slate-900/95 shadow-[0_12px_40px_rgba(0,0,0,0.28)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-300">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"><Wallet size={16} className="text-white" /></div><span className="font-semibold text-white text-lg" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span></div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-200">{["Features", "How It Works", "Testimonials"].map(l => <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-white transition-colors duration-200">{l}</a>)}</div>
          <button onClick={onGetStarted} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors">Sign In <ArrowRight size={14} /></button>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-3xl" /></div>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-secondary-foreground/10 text-secondary-foreground text-xs font-medium mb-6"><Sparkles size={12} className="text-accent" /> AI-Powered Fund Management Platform</div>
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight text-foreground mb-6" style={{ fontFamily: "Fraunces, serif" }}>Manage your organization&apos;s funds with <em className="not-italic text-primary">clarity</em> and confidence</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">FundFlow digitalizes financial management for NGOs, community groups, religious organizations, and student clubs — with real-time tracking, intelligent reports, and AI-powered insights.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onGetStarted} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-base">Get Started Free <ArrowRight size={16} /></button>
              <button onClick={onGetStarted} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors text-base">View Demo</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">{[{ label: "Organizations", value: "500+" }, { label: "Funds Managed", value: "Tk 2.4B+" }, { label: "Active Members", value: "18,000+" }, { label: "Accuracy Rate", value: "99.8%" }].map(s => <div key={s.label} className="bg-card rounded-2xl p-5 border border-border text-center"><p className="text-2xl font-semibold font-mono text-foreground">{s.value}</p><p className="text-xs text-muted-foreground mt-1">{s.label}</p></div>)}</div>
        </div>
      </section>

      <section id="features" className="py-24 bg-card border-t border-border"><div className="max-w-6xl mx-auto px-6"><div className="text-center mb-14"><p className="text-accent text-sm font-medium mb-2">Everything you need</p><h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Powerful features for every organization</h2><p className="text-muted-foreground mt-3 max-w-xl mx-auto">From a small student club to a national NGO — FundFlow scales to your needs with tools built for real-world financial management.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{features.map(({ icon: Icon, title, desc }) => <div key={title} className="p-6 rounded-2xl border border-border bg-background hover:shadow-md hover:border-primary/20 transition-all group"><div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors"><Icon size={20} className="text-primary" /></div><h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "Fraunces, serif" }}>{title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{desc}</p></div>)}</div></div></section>

      <section id="how-it-works" className="py-24"><div className="max-w-6xl mx-auto px-6"><div className="text-center mb-14"><p className="text-accent text-sm font-medium mb-2">Simple to set up</p><h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Up and running in minutes</h2></div><div className="grid md:grid-cols-3 gap-8">{steps.map((s, i) => <div key={s.num} className="relative">{i < steps.length - 1 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-y-px z-0" style={{ width: "calc(100% - 2rem)" }} />}<div className="relative z-10"><div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold font-mono mb-5" style={{ fontFamily: "Fraunces, serif" }}>{s.num}</div><h3 className="font-semibold text-foreground text-lg mb-2" style={{ fontFamily: "Fraunces, serif" }}>{s.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p></div></div>)}</div></div></section>

      <section className="py-12 bg-card border-y border-border"><div className="max-w-6xl mx-auto px-6"><div className="flex flex-wrap justify-center gap-8 items-center">{[{ icon: Lock, label: "End-to-end encrypted" }, { icon: Shield, label: "Role-based access control" }, { icon: Activity, label: "Real-time audit logs" }, { icon: Check, label: "99.9% uptime guarantee" }].map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground"><Icon size={16} className="text-primary" />{label}</div>)}</div></div></section>

      <section id="testimonials" className="py-24"><div className="max-w-6xl mx-auto px-6"><div className="text-center mb-14"><p className="text-accent text-sm font-medium mb-2">Trusted by leaders</p><h2 className="text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>What our users say</h2></div><div className="grid md:grid-cols-3 gap-5">{testimonials.map(t => <div key={t.name} className="bg-card rounded-2xl p-6 border border-border flex flex-col gap-4"><div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</div><p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p><div className="border-t border-border pt-4"><p className="text-sm font-semibold text-foreground">{t.name}</p><p className="text-xs text-muted-foreground mt-0.5">{t.role}</p></div></div>)}</div></div></section>

      <section className="py-20 mx-6 mb-10 rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #14C768 0%, transparent 55%)" }} /><div className="relative z-10 text-center max-w-2xl mx-auto px-6"><h2 className="text-4xl font-semibold text-white mb-4" style={{ fontFamily: "Fraunces, serif" }}>Ready to bring clarity to your finances?</h2><p className="text-white/60 mb-8 text-lg">Join hundreds of organizations already using FundFlow to manage funds with confidence.</p><button onClick={onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-white font-medium text-base hover:opacity-90 transition-opacity">Get Started Free <ArrowRight size={16} /></button></div></section>

      <section id="contact" className="py-20 px-6 pb-10"><div className="max-w-6xl mx-auto rounded-3xl border border-border bg-card p-8 md:p-10 shadow-sm"><div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center"><div><p className="text-accent text-sm font-medium mb-2">Contact us</p><h2 className="text-3xl md:text-4xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>Let&apos;s talk about your funding goals</h2><p className="text-muted-foreground mt-4 max-w-xl leading-relaxed">Reach out for demos, onboarding support, or custom plans for your organization. We&apos;re here to help you simplify fund management.</p></div><div className="rounded-2xl border border-border bg-background p-6 space-y-4"><div><p className="text-sm font-medium text-foreground">Email</p><a href="mailto:hello@fundflow.org" className="text-sm text-primary hover:underline">hello@fundflow.org</a></div><div><p className="text-sm font-medium text-foreground">Phone</p><a href="tel:+2348000000000" className="text-sm text-primary hover:underline">+234 800 000 0000</a></div><div><p className="text-sm font-medium text-foreground">Office</p><p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p></div></div></div></div></section>

      <footer className="border-t border-border py-10 px-6"><div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Wallet size={14} className="text-white" /></div><span className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>FundFlow</span></div><p className="text-sm text-muted-foreground">© 2024 FundFlow. Smart Fund Management for Every Organization.</p><div className="flex gap-5 text-sm text-muted-foreground"><a href="#" className="hover:text-foreground transition-colors">Privacy</a><a href="#" className="hover:text-foreground transition-colors">Terms</a><a href="#" className="hover:text-foreground transition-colors">Contact</a></div></div></footer>
    </div>
  );
}
