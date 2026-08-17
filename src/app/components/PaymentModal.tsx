import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Building2,
  Check,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { Member } from "../types";
import { fmt, cn } from "./shared";
import { exportPaymentReceiptPDF, exportContributionCertificatePDF } from "../utils/pdfExport";

export type PaymentGateway = "bKash" | "Nagad" | "Rocket" | "Card" | "Bank";

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  defaultAmount?: number;
  defaultCategory?: string;
  member?: Member | null;
  organizationName?: string;
  onPaymentSuccess?: (payment: {
    amount: number;
    category: string;
    reference: string;
    method: string;
    memberId?: string;
    description: string;
  }) => void;
}

const CATEGORIES = [
  "Monthly Contribution",
  "Welfare Fund Donation",
  "Event Sponsorship",
  "Membership Fee",
  "Emergency Relief",
  "Other Contribution",
];

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export function PaymentModal({
  open,
  onClose,
  defaultAmount,
  defaultCategory = "Monthly Contribution",
  member,
  organizationName = "FundFlow Community Trust",
  onPaymentSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<"details" | "checkout" | "processing" | "success">("details");
  const [method, setMethod] = useState<PaymentGateway>("bKash");
  const [subMode, setSubMode] = useState<"qr" | "otp">("qr");
  const [amount, setAmount] = useState<number>(defaultAmount || (member?.outstanding && member.outstanding > 0 ? member.outstanding : 1000));
  const [category, setCategory] = useState<string>(defaultCategory);
  const [customNote, setCustomNote] = useState("");
  
  // Wallet / OTP form state
  const [phone, setPhone] = useState(member?.phone || "01712-345678");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8892");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("321");
  const [cardHolder, setCardHolder] = useState(member?.name || "MD AL AMIN");

  // Timer & Reconcile Simulation
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [processingMsg, setProcessingMsg] = useState("Initiating secure gateway handshake...");
  const [completedTrx, setCompletedTrx] = useState<{
    receiptNo: string;
    trxId: string;
    amount: number;
    category: string;
    method: string;
    date: string;
    remainingOutstanding: number;
  } | null>(null);

  // Reset when opened with new defaults
  useEffect(() => {
    if (open) {
      setStep("details");
      setAmount(defaultAmount || (member?.outstanding && member.outstanding > 0 ? member.outstanding : 1000));
      setCategory(defaultCategory || "Monthly Contribution");
      setOtp("");
      setPin("");
      setTimeLeft(300);
      setCompletedTrx(null);
    }
  }, [open, defaultAmount, defaultCategory, member]);

  // Countdown timer for QR
  useEffect(() => {
    if (!open || step !== "checkout") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, step]);

  if (!open) return null;

  const payerName = member?.name || "Member Contributor";
  const payerEmail = member?.email || "member@fundflow.org";
  const payerPhone = member?.phone || phone;
  const payerInitials = member?.initials || "MB";

  const gatewayDetails: Record<
    PaymentGateway,
    { name: string; brandColor: string; bgGradient: string; merchant: string; fee: string; badge: string }
  > = {
    bKash: {
      name: "bKash Direct",
      brandColor: "#D12053",
      bgGradient: "from-[#E2136E]/10 to-transparent",
      merchant: "01788-990011 (Merchant ID: 88402)",
      fee: "0.00% (Fee Waived)",
      badge: "Instant Approval",
    },
    Nagad: {
      name: "Nagad Wallet",
      brandColor: "#F7941D",
      bgGradient: "from-[#F7941D]/10 to-transparent",
      merchant: "01888-223344 (Merchant ID: 55109)",
      fee: "0.00% (Fee Waived)",
      badge: "Instant Approval",
    },
    Rocket: {
      name: "DBBL Rocket",
      brandColor: "#8C3494",
      bgGradient: "from-[#8C3494]/10 to-transparent",
      merchant: "01988-334455-8 (Biller ID: 9912)",
      fee: "0.00% (Fee Waived)",
      badge: "Instant Approval",
    },
    Card: {
      name: "Visa / Mastercard",
      brandColor: "#0284C7",
      bgGradient: "from-sky-500/10 to-transparent",
      merchant: "FundFlow Treasury Global POS",
      fee: "0.00% (Fee Waived)",
      badge: "3D Secure",
    },
    Bank: {
      name: "Bank Wire / EFT",
      brandColor: "#0B4832",
      bgGradient: "from-emerald-800/10 to-transparent",
      merchant: "City Bank Ltd - Acc: 11029482001 (FundFlow Trust)",
      fee: "0.00% (Fee Waived)",
      badge: "Real-time BEFTN",
    },
  };

  const currentGw = gatewayDetails[method];

  const handleSimulatePayment = () => {
    setStep("processing");
    setProcessingMsg("Contacting " + currentGw.name + " Secure Switch...");

    setTimeout(() => {
      setProcessingMsg("Authenticating digital credentials & token...");
    }, 900);

    setTimeout(() => {
      setProcessingMsg("Reconciling organizational ledger & updating treasury...");
    }, 1800);

    setTimeout(() => {
      const generatedTrxId = `TRX-${method.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-8)}`;
      const generatedReceiptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOutstanding = member ? Math.max(0, (member.outstanding || 0) - amount) : 0;

      const result = {
        receiptNo: generatedReceiptNo,
        trxId: generatedTrxId,
        amount,
        category,
        method: currentGw.name,
        date: new Date().toISOString().slice(0, 10),
        remainingOutstanding: newOutstanding,
      };

      setCompletedTrx(result);
      setStep("success");

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 110,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14C768", "#0B4832", "#F59E0B", "#3B82F6", "#EC4899"],
        });
      } catch (e) {
        // Fallback gracefully
      }

      // Notify parent to update state and database
      if (onPaymentSuccess) {
        onPaymentSuccess({
          amount,
          category,
          reference: generatedTrxId,
          method: currentGw.name,
          memberId: member?.id,
          description: customNote || `${category} payment via ${currentGw.name}`,
        });
      }
    }, 2800);
  };

  const handleDownloadReceipt = () => {
    if (!completedTrx) return;
    exportPaymentReceiptPDF({
      receiptNumber: completedTrx.receiptNo,
      transactionId: completedTrx.trxId,
      payerName,
      payerEmail,
      payerPhone,
      payerInitials,
      memberId: member?.id,
      amount: completedTrx.amount,
      category: completedTrx.category,
      paymentMethod: completedTrx.method,
      paymentDate: completedTrx.date,
      organizationName,
      status: "completed",
      remainingOutstanding: completedTrx.remainingOutstanding,
      totalContributions: (member?.contributions || 0) + completedTrx.amount,
      description: customNote || `${completedTrx.category} - Verified electronic payment`,
    });
  };

  const handleDownloadCertificate = () => {
    const updatedMember: Member = member
      ? {
          ...member,
          contributions: (member.contributions || 0) + (completedTrx?.amount || amount),
          outstanding: completedTrx?.remainingOutstanding ?? 0,
        }
      : {
          id: "mem-01",
          name: payerName,
          email: payerEmail,
          phone: payerPhone,
          initials: payerInitials,
          role: "member",
          joined: "2023-01-15",
          status: "active",
          contributions: (completedTrx?.amount || amount) + 120000,
          outstanding: 0,
        };

    exportContributionCertificatePDF({
      member: updatedMember,
      organizationName,
      year: new Date().getFullYear().toString(),
      totalContributions: updatedMember.contributions,
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative bg-card text-foreground rounded-3xl shadow-2xl w-full max-w-xl border border-border overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {/* Top Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-border bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base" style={{ fontFamily: "Fraunces, serif" }}>
                  FundFlow Smart Checkout
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                {organizationName} • Official Treasury Payment Rail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* ─────────────────────────────────────────────────────────────
             STEP 1: AMOUNT & METHOD CONFIGURATION
          ───────────────────────────────────────────────────────────── */}
          {step === "details" && (
            <div className="flex flex-col gap-5">
              {/* Member banner if member exists */}
              {member && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-semibold flex items-center justify-center text-xs">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Outstanding Dues
                    </p>
                    <p
                      className={cn(
                        "text-sm font-mono font-bold",
                        member.outstanding > 0 ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      {member.outstanding > 0 ? fmt(member.outstanding) : "Tk 0 (Settled)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Payment / Contribution Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                    placeholder="Enter amount in Taka"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer",
                        amount === amt
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:border-emerald-600 hover:text-foreground"
                      )}
                    >
                      +{fmt(amt)}
                    </button>
                  ))}
                  {member && member.outstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(member.outstanding)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer flex items-center gap-1",
                        amount === member.outstanding
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      )}
                    >
                      <Sparkles size={12} /> Pay Full Due ({fmt(member.outstanding)})
                    </button>
                  )}
                </div>
              </div>

              {/* Category & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Contribution Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks / Note (Optional)</label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. For March 2024 picnic / dues"
                    className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(["bKash", "Nagad", "Rocket", "Card", "Bank"] as PaymentGateway[]).map((gw) => {
                    const info = gatewayDetails[gw];
                    const isSelected = method === gw;
                    return (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setMethod(gw)}
                        className={cn(
                          "relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-600 bg-emerald-500/5 ring-2 ring-emerald-600 shadow-sm"
                            : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: info.brandColor }}
                          >
                            {gw === "Card" ? (
                              <CreditCard size={14} />
                            ) : gw === "Bank" ? (
                              <Building2 size={14} />
                            ) : (
                              gw[0]
                            )}
                          </div>
                          {isSelected && <CheckCircle2 size={15} className="text-emerald-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{info.name}</p>
                          <p className="text-[10px] text-muted-foreground">{info.badge}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setStep("checkout")}
                disabled={amount <= 0}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>Proceed to Pay {fmt(amount)}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
             STEP 2: CHECKOUT & INTERACTIVE QR / OTP GATEWAY
          ───────────────────────────────────────────────────────────── */}
          {step === "checkout" && (
            <div className="flex flex-col gap-4">
              {/* Top Gateway Pill */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/60 border border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: currentGw.brandColor }}
                  >
                    {method === "Card" ? <CreditCard size={15} /> : method === "Bank" ? <Building2 size={15} /> : method[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{currentGw.name}</p>
                    <p className="text-[11px] text-muted-foreground">{currentGw.merchant}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-emerald-700">{fmt(amount)}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">{currentGw.fee}</p>
                </div>
              </div>

              {/* Method Tabs (QR Code vs Direct Wallet/Form) */}
              {method !== "Card" && method !== "Bank" && (
                <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setSubMode("qr")}
                    className={cn(
                      "py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      subMode === "qr" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <QrCode size={14} />
                    <span>Scan Dynamic QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubMode("otp")}
                    className={cn(
                      "py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      subMode === "otp" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Smartphone size={14} />
                    <span>Mobile Wallet / OTP</span>
                  </button>
                </div>
              )}

              {/* Submode 1: QR Code View */}
              {(subMode === "qr" || method === "Bank") && method !== "Card" && (
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-card border border-border text-center gap-4">
                  {/* Dynamic QR SVG */}
                  <div className="relative p-4 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
                    <svg
                      viewBox="0 0 140 140"
                      className="w-36 h-36"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Corner 1 */}
                      <rect x="5" y="5" width="35" height="35" rx="4" stroke="#09182A" strokeWidth="6" />
                      <rect x="15" y="15" width="15" height="15" fill="#0B4832" />
                      {/* Corner 2 */}
                      <rect x="100" y="5" width="35" height="35" rx="4" stroke="#09182A" strokeWidth="6" />
                      <rect x="110" y="15" width="15" height="15" fill="#0B4832" />
                      {/* Corner 3 */}
                      <rect x="5" y="100" width="35" height="35" rx="4" stroke="#09182A" strokeWidth="6" />
                      <rect x="15" y="110" width="15" height="15" fill="#0B4832" />
                      {/* QR Dots Simulation */}
                      <rect x="50" y="10" width="10" height="10" fill="#09182A" />
                      <rect x="70" y="10" width="15" height="10" fill="#14C768" />
                      <rect x="50" y="30" width="20" height="10" fill="#09182A" />
                      <rect x="80" y="30" width="10" height="15" fill="#09182A" />
                      <rect x="10" y="55" width="15" height="10" fill="#09182A" />
                      <rect x="35" y="55" width="10" height="20" fill="#14C768" />
                      <rect x="55" y="55" width="30" height="30" rx="4" fill="#0B4832" />
                      <rect x="95" y="55" width="15" height="10" fill="#09182A" />
                      <rect x="120" y="55" width="10" height="20" fill="#09182A" />
                      <rect x="10" y="80" width="20" height="10" fill="#09182A" />
                      <rect x="95" y="75" width="10" height="15" fill="#14C768" />
                      <rect x="50" y="95" width="20" height="10" fill="#09182A" />
                      <rect x="80" y="95" width="15" height="20" fill="#09182A" />
                      <rect x="105" y="105" width="25" height="10" fill="#14C768" />
                      <rect x="50" y="115" width="15" height="15" fill="#09182A" />
                      <rect x="75" y="125" width="20" height="8" fill="#09182A" />
                      <rect x="115" y="125" width="15" height="8" fill="#09182A" />
                      {/* Center Brand Icon */}
                      <circle cx="70" cy="70" r="10" fill="white" />
                      <circle cx="70" cy="70" r="8" fill="#14C768" />
                    </svg>
                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                      <span className="bg-emerald-800 text-white text-[9px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs">
                        {fmt(amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-foreground">
                      Scan with {currentGw.name} App to Pay
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Open your app, tap <strong>Scan QR</strong>, and confirm the exact amount of {fmt(amount)}.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-700 font-mono mt-1">
                      <Clock size={12} />
                      <span>QR Session expires in: {formatTimer(timeLeft)}</span>
                    </div>
                  </div>

                  {/* Simulator Trigger */}
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Simulate Successful QR App Scan & Approval</span>
                  </button>
                </div>
              )}

              {/* Submode 2: Direct OTP Mobile Wallet */}
              {subMode === "otp" && method !== "Card" && method !== "Bank" && (
                <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-card border border-border">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      {currentGw.name} Account / Mobile Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">6-Digit OTP</label>
                        <button
                          type="button"
                          onClick={() => setOtp("749201")}
                          className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                        >
                          Auto-fill Demo
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="749201"
                        className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground">Wallet PIN</label>
                      <input
                        type="password"
                        maxLength={5}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="•••••"
                        className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
                  >
                    <Lock size={14} />
                    <span>Confirm & Authorize {fmt(amount)}</span>
                  </button>
                </div>
              )}

              {/* Submode 3: Card Details Form */}
              {method === "Card" && (
                <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-card border border-border">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-xs font-mono text-center focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground">CVV / CVC</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-xs font-mono text-center focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
                  >
                    <Lock size={14} />
                    <span>Pay {fmt(amount)} via Secure 3D Card Rail</span>
                  </button>
                </div>
              )}

              {/* Back to Step 1 */}
              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors cursor-pointer"
              >
                ← Change Amount or Gateway
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
             STEP 3: REAL-TIME RECONCILIATION SPINNER
          ───────────────────────────────────────────────────────────── */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={28} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <h4 className="text-base font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                  Verifying Transaction...
                </h4>
                <p className="text-xs text-muted-foreground font-mono transition-all animate-pulse">
                  {processingMsg}
                </p>
              </div>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
             STEP 4: SUCCESS CELEBRATION & INSTANT DOWNLOADS
          ───────────────────────────────────────────────────────────── */}
          {step === "success" && completedTrx && (
            <div className="flex flex-col items-center text-center gap-5">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-75 duration-300">
                <Check size={32} strokeWidth={3} />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-semibold">
                  Payment Reconciled & Verified ✓
                </span>
                <h3 className="text-xl font-bold text-foreground mt-2" style={{ fontFamily: "Fraunces, serif" }}>
                  {fmt(completedTrx.amount)} Paid Successfully!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Deposited into {organizationName} treasury ledger.
                </p>
              </div>

              {/* Receipt Snapshot Card */}
              <div className="w-full p-4 rounded-2xl bg-muted/40 border border-border text-left flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <span className="font-mono font-semibold text-foreground">{completedTrx.receiptNo}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono text-foreground">{completedTrx.trxId}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Payer:</span>
                  <span className="font-medium text-foreground">{payerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-foreground">{completedTrx.category}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground">Remaining Outstanding:</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      completedTrx.remainingOutstanding > 0 ? "text-amber-700" : "text-emerald-700"
                    )}
                  >
                    {completedTrx.remainingOutstanding > 0
                      ? fmt(completedTrx.remainingOutstanding)
                      : "Tk 0 (Fully Settled ✓)"}
                  </span>
                </div>
              </div>

              {/* Download Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Money Receipt (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  className="flex-1 py-3 px-4 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileCheck size={15} className="text-emerald-600" />
                  <span>Contribution Certificate (PDF)</span>
                </button>
              </div>

              {/* Finish & Return */}
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground font-medium py-1 transition-colors cursor-pointer"
              >
                Done & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
