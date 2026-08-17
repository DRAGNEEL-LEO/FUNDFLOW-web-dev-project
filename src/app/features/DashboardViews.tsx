import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  CreditCard,
  Download,
  Edit2,
  FileCheck,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Avatar, Btn, Input, Modal, Select, StatCard, fmt, fmtDate, fmtK, cn } from "../components/shared";
import { EXPENSE_PIE, MONTHLY_DATA, SEED_ANNOUNCEMENTS, SEED_MEMBERS, SEED_TRANSACTIONS } from "../data";
import type { Announcement, Member, Role, Transaction } from "../types";
import {
  exportOrganizationPDF,
  exportIncomeReport,
  exportExpenseReport,
  exportMembersReport,
  exportPaymentReceiptPDF,
  exportContributionCertificatePDF,
} from "../utils/pdfExport";
import { PaymentModal } from "../components/PaymentModal";

const INCOME_CATS = ["Monthly Contribution", "Donation", "Membership Fee", "Sponsorship", "Other"];
const EXPENSE_CATS = ["Operations", "Events", "Welfare", "Education", "Admin", "Other"];

export function DashboardView() {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = 1248500 + totalIncome - totalExpenses;
  const activeMembers = SEED_MEMBERS.filter((m) => m.status === "active").length;
  const recent = transactions.slice(0, 6);

  const handleExport = () => {
    exportOrganizationPDF({
      organizationName: "FundFlow Community Trust",
      reportTitle: "Executive Financial & Management Report",
      reportSubtitle: "Complete organizational performance and financial ledger audit",
      generatedBy: "System Administrator",
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
      members: SEED_MEMBERS,
      transactions,
      announcements: SEED_ANNOUNCEMENTS,
    });
  };

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
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              Organization Executive Dashboard
            </h2>
            <Badge label="Audit Ready" variant="success" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            FundFlow Community Trust • Real-time financial & membership status
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPayModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <QrCode size={14} className="text-emerald-700" />
            <span>Receive via QR</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fund Balance" value={fmt(balance)} sub="As of today" icon={Wallet} trend={8.9} color="balance" />
        <StatCard label="Total Income" value={fmt(totalIncome)} sub="This period" icon={TrendingUp} trend={12.4} color="income" />
        <StatCard label="Total Expenses" value={fmt(totalExpenses)} sub="This period" icon={TrendingDown} trend={-3.2} color="expense" />
        <StatCard label="Active Members" value={String(activeMembers)} sub={`of ${SEED_MEMBERS.length} total`} icon={Users} trend={6} color="members" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                Income vs Expenses
              </h3>
              <p className="text-xs text-muted-foreground">Last 7 months overview</p>
            </div>
            <Badge label="2024" variant="neutral" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Outfit" }} />
              <Bar dataKey="income" name="Income" fill="#14C768" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#0B4832" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-1" style={{ fontFamily: "Fraunces, serif" }}>
            Expense Categories
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Current period breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={EXPENSE_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {EXPENSE_PIE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {EXPENSE_PIE.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-medium text-foreground">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
              Recent Transactions
            </h3>
            <Badge label={`${recent.length} shown`} variant="neutral" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportIncomeReport(transactions, "FundFlow Community Trust")}
              className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
            >
              <Download size={13} /> Income PDF
            </button>
            <button
              onClick={() => exportExpenseReport(transactions, "FundFlow Community Trust", EXPENSE_PIE)}
              className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 cursor-pointer"
            >
              <Download size={13} /> Expense PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Description", "Category", "Date", "Amount", "Status", "Receipt"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((tx, i) => (
                <tr key={tx.id} className={cn("border-t border-border/50 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                          tx.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        )}
                      >
                        {tx.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <span className="text-foreground font-medium">{tx.description}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{tx.category}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{fmtDate(tx.date)}</td>
                  <td className={cn("px-5 py-3.5 font-mono font-semibold", tx.type === "income" ? "text-emerald-700" : "text-red-600")}>
                    {tx.type === "income" ? "+" : "-"}
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} />
                  </td>
                  <td className="px-5 py-3.5">
                    {tx.type === "income" && (
                      <button
                        onClick={() =>
                          exportPaymentReceiptPDF({
                            transactionId: tx.reference || `TXN-${tx.id}`,
                            payerName: "Authorized Member / Contributor",
                            amount: tx.amount,
                            category: tx.category,
                            paymentMethod: "Electronic Gateway",
                            paymentDate: tx.date,
                            description: tx.description,
                          })
                        }
                        title="Download Receipt Voucher (PDF)"
                        className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Download size={11} />
                        <span>PDF</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        organizationName="FundFlow Community Trust"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export function MembersView() {
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "active" });

  // Payment Modal integration for members
  const [payingMember, setPayingMember] = useState<Member | null>(null);

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      ),
    [members, search]
  );

  const openAdd = () => {
    setForm({ name: "", email: "", phone: "", status: "active" });
    setModal("add");
  };

  const openEdit = (m: Member) => {
    setEditTarget(m);
    setForm({ name: m.name, email: m.email, phone: m.phone, status: m.status });
    setModal("edit");
  };

  const handleSave = () => {
    if (modal === "add") {
      setMembers((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: "member",
          initials: form.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          joined: new Date().toISOString().slice(0, 10),
          status: form.status as "active" | "inactive",
          contributions: 0,
          outstanding: 0,
        },
      ]);
    } else if (modal === "edit" && editTarget) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? { ...m, name: form.name, email: form.email, phone: form.phone, status: form.status as "active" | "inactive" }
            : m
        )
      );
    }
    setModal(null);
  };

  const handleDelete = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleMemberPaymentSuccess = (payment: { amount: number; memberId?: string }) => {
    if (payingMember) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === payingMember.id
            ? {
                ...m,
                contributions: m.contributions + payment.amount,
                outstanding: Math.max(0, m.outstanding - payment.amount),
              }
            : m
        )
      );
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMembersReport(members, "FundFlow Community Trust")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card text-foreground hover:bg-muted text-xs font-medium border border-border transition-colors cursor-pointer"
          >
            <Download size={14} className="text-muted-foreground" />
            <span>Export Roster PDF</span>
          </button>
          <Btn onClick={openAdd}>
            <Plus size={15} /> Add Member
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono">{members.filter((m) => m.status === "active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Members</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono">{members.filter((m) => m.status === "inactive").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Inactive</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-semibold font-mono text-amber-700">
            {members.filter((m) => m.outstanding > 0).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding Dues</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Member", "Contact", "Joined", "Contributions", "Outstanding", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
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
                            organizationName: "FundFlow Community Trust",
                          })
                        }
                        title="Download Annual Contribution Certificate (PDF)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-colors cursor-pointer"
                      >
                        <FileCheck size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        title="Edit Member"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Delete Member"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "add" ? "Add New Member" : "Edit Member"}>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Amara Nwosu" />
          <Input label="Email Address" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" placeholder="member@example.com" />
          <Input label="Phone Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+880 1700 000000" />
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(null)} variant="ghost" className="flex-1 justify-center">
              Cancel
            </Btn>
            <Btn onClick={handleSave} className="flex-1 justify-center">
              <Check size={14} /> Save
            </Btn>
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
          organizationName="FundFlow Community Trust"
          onPaymentSuccess={handleMemberPaymentSuccess}
        />
      )}
    </div>
  );
}

export function IncomeView() {
  const [txs, setTxs] = useState<Transaction[]>(SEED_TRANSACTIONS.filter((t) => t.type === "income"));
  const [modal, setModal] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "Monthly Contribution", date: "" });
  const total = txs.reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    if (!form.description || !form.amount || !form.date) return;
    setTxs((prev) => [
      {
        id: String(Date.now()),
        type: "income",
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        date: form.date,
        reference: `INC-${Date.now()}`,
        status: "completed",
      },
      ...prev,
    ]);
    setModal(false);
    setForm({ description: "", amount: "", category: "Monthly Contribution", date: "" });
  };

  const handlePaymentSuccess = (payment: {
    amount: number;
    category: string;
    reference: string;
    description: string;
  }) => {
    setTxs((prev) => [
      {
        id: String(Date.now()),
        type: "income",
        category: payment.category,
        amount: payment.amount,
        description: payment.description,
        date: new Date().toISOString().slice(0, 10),
        reference: payment.reference,
        status: "completed",
      },
      ...prev,
    ]);
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
          <Btn onClick={() => setModal(true)}>
            <Plus size={15} /> Record Income
          </Btn>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
            Income Records
          </h3>
          <button
            onClick={() => exportIncomeReport(txs, "FundFlow Community Trust")}
            className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Description", "Category", "Reference", "Date", "Amount", "Status", "Receipt"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
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
                  <td className="px-5 py-3.5">
                    <Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} />
                  </td>
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
                          description: tx.description,
                        })
                      }
                      title="Download Official Money Receipt (PDF)"
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
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Income">
        <div className="flex flex-col gap-4">
          <Input label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="e.g. March member contributions" />
          <Input label="Amount (Tk)" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
          <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={INCOME_CATS.map((c) => ({ value: c, label: c }))} />
          <Input label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} type="date" />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">
              Cancel
            </Btn>
            <Btn onClick={handleAdd} className="flex-1 justify-center">
              <Check size={14} /> Save
            </Btn>
          </div>
        </div>
      </Modal>

      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        organizationName="FundFlow Community Trust"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export function ExpensesView() {
  const [txs, setTxs] = useState<Transaction[]>(SEED_TRANSACTIONS.filter((t) => t.type === "expense"));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "Operations", date: "" });
  const total = txs.reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    if (!form.description || !form.amount || !form.date) return;
    setTxs((prev) => [
      {
        id: String(Date.now()),
        type: "expense",
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        date: form.date,
        reference: `EXP-${Date.now()}`,
        status: "completed",
      },
      ...prev,
    ]);
    setModal(false);
    setForm({ description: "", amount: "", category: "Operations", date: "" });
  };

  const handleDelete = (id: string) => setTxs((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex items-center justify-between">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Total Expenses Recorded</p>
          <p className="text-2xl font-semibold font-mono text-red-600 mt-1">{fmt(total)}</p>
        </div>
        <Btn onClick={() => setModal(true)}>
          <Plus size={15} /> Record Expense
        </Btn>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
            Expense Records
          </h3>
          <button
            onClick={() => exportExpenseReport(txs, "FundFlow Community Trust", EXPENSE_PIE)}
            className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Description", "Category", "Reference", "Date", "Amount", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
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
                  <td className="px-5 py-3.5">
                    <Badge label={tx.status} variant={tx.status === "completed" ? "success" : "warning"} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Expense">
        <div className="flex flex-col gap-4">
          <Input label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="e.g. Office supplies" />
          <Input label="Amount (Tk)" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} type="number" placeholder="0.00" />
          <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={EXPENSE_CATS.map((c) => ({ value: c, label: c }))} />
          <Input label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} type="date" />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">
              Cancel
            </Btn>
            <Btn onClick={handleAdd} className="flex-1 justify-center">
              <Check size={14} /> Save
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ReportsView({ transactions = SEED_TRANSACTIONS }: { transactions?: Transaction[] }) {
  const [tab, setTab] = useState<"overview" | "income" | "expenses">("overview");

  const totalIncome = useMemo(() => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? `${Math.max(0, (netBalance / totalIncome) * 100).toFixed(1)}%` : "0.0%";

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

    transactions.forEach((t) => {
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
    const expenses = transactions.filter((t) => t.type === "expense");
    if (expenses.length === 0) return [];
    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const colors = ["#0B4832", "#14C768", "#F59E0B", "#6366F1", "#EC4899", "#3B82F6", "#8B5CF6"];
    return Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
    }));
  }, [transactions]);

  const incomeCategories = useMemo(() => {
    const incomes = transactions.filter((t) => t.type === "income");
    if (incomes.length === 0) return [];
    const catMap: Record<string, number> = {};
    incomes.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    return Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percent: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : "0",
    }));
  }, [transactions, totalIncome]);

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
        {(["overview", "income", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Net Balance", value: fmt(netBalance), color: netBalance >= 0 ? "text-foreground" : "text-red-600" },
              { label: "Total Income (YTD)", value: fmt(totalIncome), color: "text-emerald-700" },
              { label: "Total Expenses (YTD)", value: fmt(totalExpenses), color: "text-red-600" },
              { label: "Savings Rate", value: savingsRate, color: "text-indigo-700" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-semibold font-mono mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
              7-Month Income vs Expense Trend
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Rolling monthly treasury comparison</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
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
                <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
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
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
              Monthly Income Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Monthly recorded income</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
                <Bar dataKey="income" name="Total Income" fill="#14C768" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border flex flex-col justify-between">
            <div>
              <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                Income by Category
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Revenue stream distribution</p>
            </div>
            {incomeCategories.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                <ArrowUpRight size={28} className="text-emerald-600/50 mb-1" />
                <p className="text-xs font-semibold text-foreground">No income recorded yet</p>
                <p className="text-[11px] text-muted-foreground">Collections recorded in Fund Income will appear categorized here.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {incomeCategories.map((cat) => (
                  <div key={cat.category} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{cat.category}</p>
                      <p className="text-xs text-muted-foreground">{cat.percent}% of total revenues</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-700">+{fmt(cat.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
              Monthly Expenses
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Monthly expense disbursements</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6560", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontFamily: "DM Mono", fontSize: 12 }} />
                <Bar dataKey="expenses" name="Expenses" fill="#0B4832" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border flex flex-col justify-between">
            <div>
              <h3 className="font-semibold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                Expense by Category
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Distribution for current period</p>
            </div>
            {expensePie.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                <TrendingDown size={28} className="text-red-500/50 mb-1" />
                <p className="text-xs font-semibold text-foreground">No expenses recorded yet</p>
                <p className="text-[11px] text-muted-foreground">Disbursements recorded in the Expenses tab will appear here.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expensePie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {expensePie.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-y-2 mt-3">
                  {expensePie.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs font-mono font-medium text-foreground ml-auto">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnnouncementsView({ role }: { role: Role }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", priority: "medium" });

  const handlePost = () => {
    if (!form.title || !form.body) return;
    setAnnouncements((prev) => [
      {
        id: String(Date.now()),
        title: form.title,
        body: form.body,
        date: new Date().toISOString().slice(0, 10),
        priority: form.priority as "high" | "medium" | "low",
        author: "Admin Office",
      },
      ...prev,
    ]);
    setModal(false);
    setForm({ title: "", body: "", priority: "medium" });
  };

  const priorityVariant: Record<string, "danger" | "warning" | "neutral"> = {
    high: "danger",
    medium: "warning",
    low: "neutral",
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "Outfit, sans-serif" }}>
      {role === "admin" && (
        <div className="flex justify-end">
          <Btn onClick={() => setModal(true)}>
            <Plus size={15} /> Post Announcement
          </Btn>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-card rounded-2xl p-5 border border-border hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                {a.title}
              </h3>
              <Badge label={a.priority} variant={priorityVariant[a.priority]} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.body}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1.5">
                <User size={12} /> {a.author}
              </span>
              <span className="font-mono">{fmtDate(a.date)}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Post Announcement">
        <div className="flex flex-col gap-4">
          <Input label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Announcement title" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your announcement here..."
              rows={4}
              className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
            options={[
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <div className="flex gap-3 mt-2">
            <Btn onClick={() => setModal(false)} variant="ghost" className="flex-1 justify-center">
              Cancel
            </Btn>
            <Btn onClick={handlePost} className="flex-1 justify-center">
              <Check size={14} /> Post
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AIView({ role }: { role: Role }) {
  const [loading, setLoading] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const handleAnalyse = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalysed(true);
    }, 2200);
  };
  const healthScore = 78;

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      <div
        className="rounded-2xl p-6 border border-border relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #14C768 0%, transparent 60%)" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-accent" />
              <span className="text-accent text-sm font-medium">AI-Powered Analysis</span>
            </div>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "Fraunces, serif" }}>
              {role === "admin" ? "Financial Intelligence Report" : "Your Personal Financial Summary"}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {analysed ? "Analysis complete — last run just now" : "Click to generate a fresh analysis of your financial data"}
            </p>
          </div>
          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-60 flex-shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <Sparkles size={15} /> {analysed ? "Re-analyse" : "Generate Analysis"}
              </>
            )}
          </button>
        </div>
      </div>

      {!analysed && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "Fraunces, serif" }}>
            Ready to generate insights
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Click the button above to analyse your financial data and receive AI-powered recommendations and insights.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Analysing financial data, patterns, and trends...</p>
        </div>
      )}

      {analysed && !loading && role === "admin" && (
        <div className="flex flex-col gap-5">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground" style={{ fontFamily: "Fraunces, serif" }}>
                  Financial Health Score
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Based on income stability, expense ratio, and reserves</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-semibold font-mono text-emerald-700">{healthScore}</p>
                <Badge label="Good" variant="success" />
              </div>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-accent transition-all duration-1000"
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0 — Critical</span>
              <span>100 — Excellent</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Activity size={16} className="text-indigo-600" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Spending Pattern Analysis</h4>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  • Event spending increased <strong className="text-foreground">42%</strong> in Q1 2024 vs Q4 2023
                </p>
                <p>
                  • Operations costs remained <strong className="text-foreground">stable</strong> month-over-month
                </p>
                <p>• Welfare expenditures grew proportionally with member growth (+15%)</p>
                <p>
                  • Admin overhead is below industry average at <strong className="text-foreground">13.8%</strong> of total expenses
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Cash Flow Insights</h4>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  • Positive cash flow maintained for <strong className="text-foreground">7 consecutive months</strong>
                </p>
                <p>
                  • Average monthly surplus: <strong className="text-foreground">Tk 168,500</strong>
                </p>
                <p>
                  • Current reserves provide a <strong className="text-foreground">3.2-month</strong> operational runway
                </p>
                <p>• Sponsorship income diversification reduced revenue concentration risk</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Target size={16} className="text-amber-600" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">30-Day Balance Forecast</h4>
              </div>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-semibold font-mono text-foreground">Tk 1,874,500</p>
                </div>
                <ArrowUpRight size={20} className="text-emerald-500 mb-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Predicted (30 days)</p>
                  <p className="text-xl font-semibold font-mono text-emerald-700">Tk 2,043,000</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">+8.9% growth predicted based on historical patterns. Confidence: 84%</p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Budget Recommendations</h4>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  "Increase monthly contribution target by 8% to build a 6-month emergency reserve",
                  "Switch software subscriptions to annual billing — estimated Tk 32,000 annual savings",
                  "Event budget optimization could cut Tk 12,000/month without quality impact",
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-accent text-xs font-mono font-medium">{i + 1}</span>
                    </div>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {analysed && !loading && role === "member" && (
        <div className="flex flex-col gap-5">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-xs text-muted-foreground">Your Total Contributions</p>
              <p className="text-2xl font-semibold font-mono text-emerald-700 mt-1">Tk 124,000</p>
              <p className="text-xs text-muted-foreground mt-1">Since Jan 2023</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-semibold font-mono text-amber-700 mt-1">Tk 0</p>
              <p className="text-xs text-accent mt-1 flex items-center gap-1">
                <Check size={12} /> Fully paid up
              </p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-xs text-muted-foreground">Contribution Rank</p>
              <p className="text-2xl font-semibold font-mono mt-1">#3 of 8</p>
              <p className="text-xs text-muted-foreground mt-1">Top 40% of contributors</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h4 className="font-semibold mb-3" style={{ fontFamily: "Fraunces, serif" }}>
              Personalized Recommendations
            </h4>
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Check,
                  text: "You are fully up to date — no outstanding contributions. Excellent standing!",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: Target,
                  text: "Increasing your monthly contribution by Tk 2,000 would move you into the top 25% of contributors.",
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  icon: Bell,
                  text: "Next contribution window opens May 1st. Set a reminder to contribute early and maintain your excellent track record.",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map(({ icon: Icon, text, color, bg }, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                    <Icon size={14} className={color} />
                  </div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MemberHomeView() {
  const [me, setMe] = useState<Member>(SEED_MEMBERS[0]);
  const [myTxs, setMyTxs] = useState<Transaction[]>(
    SEED_TRANSACTIONS.filter((t) => t.type === "income" && t.category === "Monthly Contribution").slice(0, 4)
  );
  const [payModalOpen, setPayModalOpen] = useState(false);

  const handlePaymentSuccess = (payment: {
    amount: number;
    category: string;
    reference: string;
    description: string;
  }) => {
    // Update local member state
    setMe((prev) => ({
      ...prev,
      contributions: prev.contributions + payment.amount,
      outstanding: Math.max(0, prev.outstanding - payment.amount),
    }));

    // Add new tx
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
    setMyTxs((prev) => [newTx, ...prev]);
  };

  const handleDownloadCertificate = () => {
    exportContributionCertificatePDF({
      member: me,
      organizationName: "FundFlow Community Trust",
      year: new Date().getFullYear().toString(),
      totalContributions: me.contributions,
    });
  };

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Welcome Banner with Certificate Button */}
      <div
        className="rounded-2xl p-6 border border-border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #09182A 0%, #0B4832 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 60%, #14C768 0%, transparent 55%)" }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <Avatar initials={me.initials} size="lg" color="#14C768" />
          <div>
            <p className="text-white/60 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "Fraunces, serif" }}>
              {me.name}
            </h2>
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
          <div className="mt-1.5">
            <Badge label={me.status} variant={me.status === "active" ? "success" : "neutral"} />
          </div>
        </div>
      </div>

      {/* Organization Summary */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold mb-4" style={{ fontFamily: "Fraunces, serif" }}>
          Organization Fund Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Fund Balance", value: "Tk 1,874,500", color: "text-foreground" },
            { label: "Active Members", value: "6 of 8", color: "text-foreground" },
            { label: "Total Income (YTD)", value: "Tk 1,671,000", color: "text-emerald-700" },
            { label: "Total Expenses (YTD)", value: "Tk 579,500", color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-base font-semibold font-mono mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment / Contribution CTA Banner */}
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
              Pay Monthly Dues or Donate
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Support FundFlow securely via bKash, Nagad, Rocket, or Cards. Instant digital receipt and live ledger reconciliation.
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

      {/* Recent Activity with Instant PDF Receipts */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
            Recent Contribution Activity
          </h3>
          <span className="text-xs text-muted-foreground font-mono">{myTxs.length} records</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {myTxs.map((tx) => (
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
                      paymentMethod: "bKash / Electronic Transfer",
                      paymentDate: tx.date,
                      description: tx.description,
                      remainingOutstanding: me.outstanding,
                    })
                  }
                  title="Download Electronic Receipt Voucher (PDF)"
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Download size={11} />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements Preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold" style={{ fontFamily: "Fraunces, serif" }}>
            Latest Announcements
          </h3>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {SEED_ANNOUNCEMENTS.slice(0, 2).map((a) => (
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
