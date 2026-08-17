import { useState } from "react";
import { AlertCircle, ArrowRight, Wallet, Building2, Sparkles } from "lucide-react";
import { Btn, Input, cn } from "../components/shared";
import type { Role } from "../types";
import { apiFetch, storeAuth } from "../api";
import { validateLoginPayload, validateRegisterOrgPayload } from "../../../lib/validation.js";

export function LoginView({
  onLogin,
  onBack,
}: {
  onLogin: (role: Role, token?: string, name?: string, email?: string, orgName?: string, orgId?: string) => void;
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
