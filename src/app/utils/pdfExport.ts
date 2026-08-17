import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Announcement, Member, Transaction } from "../types";

export interface PDFExportOptions {
  organizationName: string;
  reportTitle?: string;
  reportSubtitle?: string;
  generatedBy?: string;
  includeKPIs?: boolean;
  includeMonthlyTrend?: boolean;
  includeExpenseCategories?: boolean;
  includeMembers?: boolean;
  includeTransactions?: boolean;
  transactionLimit?: "10" | "25" | "50" | "all";
  includeAnnouncements?: boolean;
  includeSignatures?: boolean;
  monthlyData?: { month: string; income: number; expenses: number }[];
  expensePie?: { name: string; value: number; color?: string }[];
  members?: Member[];
  transactions?: Transaction[];
  announcements?: Announcement[];
}

// Helpers
const fmtCurrency = (n: number) => `Tk ${n.toLocaleString("en-US")}`;
const fmtDateDisplay = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

/**
 * Generates an executive-level, professional PDF report for the organization
 */
export function exportOrganizationPDF(options: PDFExportOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Brand Palette
  const colors = {
    brandDark: [9, 24, 42] as [number, number, number], // #09182A
    brandPrimary: [11, 72, 50] as [number, number, number], // #0B4832
    brandAccent: [20, 199, 104] as [number, number, number], // #14C768
    brandLightAccent: [236, 253, 245] as [number, number, number], // #ECFDF5
    cardBg: [248, 250, 252] as [number, number, number], // #F8FAFC
    border: [226, 232, 240] as [number, number, number], // #E2E8F0
    textDark: [15, 23, 42] as [number, number, number], // #0F172A
    textMuted: [100, 116, 139] as [number, number, number], // #64748B
    income: [16, 185, 129] as [number, number, number], // #10B981
    expense: [239, 68, 68] as [number, number, number], // #EF4444
    amber: [245, 158, 11] as [number, number, number], // #F59E0B
  };

  const {
    organizationName = "FundFlow Community Trust",
    reportTitle = "Executive Financial & Management Report",
    reportSubtitle = "Comprehensive performance statement and organizational audit",
    generatedBy = "Administrator",
    includeKPIs = true,
    includeMonthlyTrend = true,
    includeExpenseCategories = true,
    includeMembers = true,
    includeTransactions = true,
    transactionLimit = "25",
    includeAnnouncements = true,
    includeSignatures = true,
    monthlyData = [],
    expensePie = [],
    members = [],
    transactions = [],
    announcements = [],
  } = options;

  let currentY = 14;

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const activeMembersCount = members.filter((m) => m.status === "active").length;
  const totalMemberContributions = members.reduce(
    (s, m) => s + (Number(m.contributions) || 0),
    0
  );
  const totalOutstanding = members.reduce(
    (s, m) => s + (Number(m.outstanding) || 0),
    0
  );

  const reportRef = `REP-${new Date().getFullYear()}${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const genDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const genTimeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Helper for Section Titles
  const drawSectionHeader = (title: string, subtitle?: string) => {
    // Check if we need a new page
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFillColor(...colors.brandPrimary);
    doc.roundedRect(marginX, currentY, 3.5, 9, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...colors.brandDark);
    doc.text(title, marginX + 6, currentY + 6.5);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(subtitle, marginX + 6, currentY + 11.5);
      currentY += 16;
    } else {
      currentY += 12;
    }
  };

  /* ─────────────────────────────────────────────────────────────
     1. BRANDED HEADER BANNER
  ───────────────────────────────────────────────────────────── */
  // Top decorative color strip
  doc.setFillColor(...colors.brandDark);
  doc.rect(0, 0, pageWidth, 4, "F");
  doc.setFillColor(...colors.brandAccent);
  doc.rect(0, 4, pageWidth, 1.5, "F");

  currentY = 14;

  // Header Container Card
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 34, 3, 3, "FD");

  // Left Icon Badge
  doc.setFillColor(...colors.brandPrimary);
  doc.roundedRect(marginX + 5, currentY + 5, 12, 12, 2.5, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FF", marginX + 7.5, currentY + 13.5);

  // Left Title & Subtitle
  doc.setTextColor(...colors.brandDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(organizationName, marginX + 21, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.brandPrimary);
  doc.text(reportTitle, marginX + 21, currentY + 15.5);

  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(reportSubtitle, marginX + 21, currentY + 20);

  // Right Metadata Badges
  const rightX = marginX + contentWidth - 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(`Doc Ref: ${reportRef}`, rightX, currentY + 9, { align: "right" });
  doc.text(`Generated: ${genDateStr} at ${genTimeStr}`, rightX, currentY + 14, {
    align: "right",
  });
  doc.text(`Authorised By: ${generatedBy}`, rightX, currentY + 19, {
    align: "right",
  });

  // Status Chip (Confidential / Official)
  doc.setFillColor(...colors.brandLightAccent);
  doc.setDrawColor(...colors.brandAccent);
  doc.setLineWidth(0.2);
  doc.roundedRect(rightX - 38, currentY + 22.5, 38, 5.5, 1.5, 1.5, "FD");
  doc.setTextColor(...colors.brandPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("OFFICIAL AUDIT REPORT", rightX - 19, currentY + 26.2, {
    align: "center",
  });

  currentY += 40;

  /* ─────────────────────────────────────────────────────────────
     2. EXECUTIVE KPI CARDS (6 Grid)
  ───────────────────────────────────────────────────────────── */
  if (includeKPIs) {
    drawSectionHeader(
      "Financial Health & Executive Summary",
      "Key organizational metrics and fund allocation overview"
    );

    const cardCols = 3;
    const cardGap = 4;
    const cardWidth = (contentWidth - (cardCols - 1) * cardGap) / cardCols; // ~58mm
    const cardHeight = 18;

    const kpiItems = [
      {
        label: "TOTAL FUND BALANCE",
        value: fmtCurrency(netBalance),
        sub: "Net Liquid Reserves",
        accent: colors.brandPrimary,
      },
      {
        label: "TOTAL REVENUE (INFLOW)",
        value: fmtCurrency(totalIncome),
        sub: `${transactions.filter((t) => t.type === "income").length} Income Records`,
        accent: colors.income,
      },
      {
        label: "TOTAL EXPENSES (OUTFLOW)",
        value: fmtCurrency(totalExpenses),
        sub: `${transactions.filter((t) => t.type === "expense").length} Expense Records`,
        accent: colors.expense,
      },
      {
        label: "ACTIVE MEMBERSHIP",
        value: `${activeMembersCount} / ${members.length}`,
        sub: `${Math.round((activeMembersCount / (members.length || 1)) * 100)}% Active Rate`,
        accent: colors.brandDark,
      },
      {
        label: "MEMBER CONTRIBUTIONS",
        value: fmtCurrency(totalMemberContributions),
        sub: "Recorded to date",
        accent: colors.brandAccent,
      },
      {
        label: "OUTSTANDING DUES",
        value: fmtCurrency(totalOutstanding),
        sub: `${members.filter((m) => m.outstanding > 0).length} Members with balances`,
        accent: colors.amber,
      },
    ];

    kpiItems.forEach((kpi, idx) => {
      const col = idx % cardCols;
      const row = Math.floor(idx / cardCols);
      const x = marginX + col * (cardWidth + cardGap);
      const y = currentY + row * (cardHeight + cardGap);

      // Card Background
      doc.setFillColor(...colors.cardBg);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

      // Left Accent Color Bar
      doc.setFillColor(...kpi.accent);
      doc.roundedRect(x, y, 2.2, cardHeight, 1, 1, "F");

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(kpi.label, x + 5, y + 4.8);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...colors.brandDark);
      doc.text(kpi.value, x + 5, y + 10.8);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(kpi.sub, x + 5, y + 15.2);
    });

    currentY += Math.ceil(kpiItems.length / cardCols) * (cardHeight + cardGap) + 5;
  }

  /* ─────────────────────────────────────────────────────────────
     3. MONTHLY PERFORMANCE & EXPENSE CATEGORY BREAKDOWN
  ───────────────────────────────────────────────────────────── */
  if (includeMonthlyTrend && monthlyData && monthlyData.length > 0) {
    drawSectionHeader(
      "Monthly Inflow vs. Outflow Trend",
      "Historical monthly financial performance and net cash margins"
    );

    const monthlyRows = monthlyData.map((m) => {
      const inc = m.income || 0;
      const exp = m.expenses || 0;
      const net = inc - exp;
      const marginPct = inc > 0 ? ((net / inc) * 100).toFixed(1) + "%" : "0%";
      return [
        m.month,
        fmtCurrency(inc),
        fmtCurrency(exp),
        fmtCurrency(net),
        marginPct,
      ];
    });

    // Total row
    const sumInc = monthlyData.reduce((s, m) => s + (m.income || 0), 0);
    const sumExp = monthlyData.reduce((s, m) => s + (m.expenses || 0), 0);
    const sumNet = sumInc - sumExp;
    const avgMargin = sumInc > 0 ? ((sumNet / sumInc) * 100).toFixed(1) + "%" : "0%";

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Period / Month", "Income (Inflow)", "Expenses (Outflow)", "Net Balance", "Net Margin"]],
      body: monthlyRows,
      foot: [["Total (YTD)", fmtCurrency(sumInc), fmtCurrency(sumExp), fmtCurrency(sumNet), avgMargin]],
      theme: "plain",
      headStyles: {
        fillColor: colors.brandPrimary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: colors.brandDark,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: colors.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold" },
        1: { halign: "right", textColor: colors.income },
        2: { halign: "right", textColor: colors.expense },
        3: { halign: "right", fontStyle: "bold" },
        4: { halign: "right" },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.15,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ─────────────────────────────────────────────────────────────
     4. EXPENSE CATEGORY DISTRIBUTION
  ───────────────────────────────────────────────────────────── */
  if (includeExpenseCategories && expensePie && expensePie.length > 0) {
    drawSectionHeader(
      "Expense Distribution by Category",
      "Functional allocation of organizational disbursements"
    );

    const totalExpPie = expensePie.reduce((s, e) => s + (e.value || 0), 0);
    const catRows = expensePie.map((e) => {
      const share = totalExpPie > 0 ? ((e.value / totalExpPie) * 100).toFixed(1) + "%" : "0%";
      return [e.name, fmtCurrency(e.value), share];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Category Name", "Total Disbursed", "Share of Total Expenses"]],
      body: catRows,
      foot: [["Total Allocated", fmtCurrency(totalExpPie), "100.0%"]],
      theme: "plain",
      headStyles: {
        fillColor: colors.brandDark,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: colors.brandDark,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: colors.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { halign: "right", fontStyle: "bold" },
        2: { halign: "right" },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.15,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ─────────────────────────────────────────────────────────────
     5. MEMBER DIRECTORY & CONTRIBUTION STATUS
  ───────────────────────────────────────────────────────────── */
  if (includeMembers && members && members.length > 0) {
    drawSectionHeader(
      "Member Directory & Contribution Ledger",
      "Roster of registered members with lifetime contributions and outstanding balances"
    );

    const memberRows = members.map((m) => [
      m.name,
      m.email,
      m.phone || "—",
      fmtDateDisplay(m.joined),
      m.status.toUpperCase(),
      fmtCurrency(m.contributions || 0),
      m.outstanding > 0 ? fmtCurrency(m.outstanding) : "Tk 0",
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          "Member Name",
          "Email Address",
          "Contact",
          "Joined Date",
          "Status",
          "Contributions",
          "Outstanding",
        ],
      ],
      body: memberRows,
      foot: [
        [
          `Total (${members.length} Members)`,
          "",
          "",
          "",
          `${activeMembersCount} Active`,
          fmtCurrency(totalMemberContributions),
          fmtCurrency(totalOutstanding),
        ],
      ],
      theme: "plain",
      headStyles: {
        fillColor: colors.brandPrimary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: colors.brandDark,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 34, fontStyle: "bold" },
        1: { cellWidth: 38 },
        2: { cellWidth: 26 },
        3: { cellWidth: 22 },
        4: { cellWidth: 16, halign: "center" },
        5: { halign: "right", textColor: colors.income, fontStyle: "bold" },
        6: { halign: "right", textColor: colors.amber, fontStyle: "bold" },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.15,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ─────────────────────────────────────────────────────────────
     6. TRANSACTION LEDGER
  ───────────────────────────────────────────────────────────── */
  if (includeTransactions && transactions && transactions.length > 0) {
    drawSectionHeader(
      "Financial Transaction Ledger",
      "Detailed chronological record of fund receipts and disbursements"
    );

    let displayTxs = [...transactions];
    if (transactionLimit === "10") displayTxs = displayTxs.slice(0, 10);
    else if (transactionLimit === "25") displayTxs = displayTxs.slice(0, 25);
    else if (transactionLimit === "50") displayTxs = displayTxs.slice(0, 50);

    const txRows = displayTxs.map((t) => [
      fmtDateDisplay(t.date),
      t.reference || `TX-${t.id.slice(0, 6)}`,
      t.description,
      t.category,
      t.type.toUpperCase(),
      t.type === "income" ? `+${fmtCurrency(t.amount)}` : `-${fmtCurrency(t.amount)}`,
      (t.status || "completed").toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Date", "Ref ID", "Description", "Category", "Type", "Amount", "Status"]],
      body: txRows,
      foot: [
        [
          `Showing ${displayTxs.length} of ${transactions.length} Records`,
          "",
          "",
          "",
          "Net",
          fmtCurrency(netBalance),
          "",
        ],
      ],
      theme: "plain",
      headStyles: {
        fillColor: colors.brandDark,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: colors.brandDark,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22, fontStyle: "bold" },
        2: { cellWidth: 48 },
        3: { cellWidth: 32 },
        4: { cellWidth: 16, halign: "center" },
        5: { halign: "right", fontStyle: "bold" },
        6: { cellWidth: 18, halign: "center" },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.15,
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const raw = String(data.cell.raw || "");
          if (raw.startsWith("+")) {
            data.cell.styles.textColor = colors.income;
          } else if (raw.startsWith("-")) {
            data.cell.styles.textColor = colors.expense;
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ─────────────────────────────────────────────────────────────
     7. ANNOUNCEMENTS / GOVERNANCE NOTICES
  ───────────────────────────────────────────────────────────── */
  if (includeAnnouncements && announcements && announcements.length > 0) {
    drawSectionHeader(
      "Recent Executive Notices & Announcements",
      "Official notices published to members and committee stakeholders"
    );

    const annRows = announcements.slice(0, 6).map((a) => [
      fmtDateDisplay(a.date),
      a.title,
      a.priority.toUpperCase(),
      a.author,
      a.body.length > 80 ? a.body.slice(0, 80) + "..." : a.body,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Date", "Title", "Priority", "Author", "Summary"]],
      body: annRows,
      theme: "plain",
      headStyles: {
        fillColor: colors.brandPrimary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.textDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 42, fontStyle: "bold" },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 26 },
        4: { cellWidth: 76 },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.15,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  /* ─────────────────────────────────────────────────────────────
     8. OFFICIAL SIGN-OFF BLOCK
  ───────────────────────────────────────────────────────────── */
  if (includeSignatures) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(...colors.cardBg);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, 30, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...colors.brandDark);
    doc.text("OFFICIAL VERIFICATION & AUDIT SIGN-OFF", marginX + 5, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.textMuted);
    doc.text(
      "This document certifies that the figures and ledgers presented herein represent an accurate state of accounts.",
      marginX + 5,
      currentY + 10
    );

    // Signature 1
    const sig1X = marginX + 15;
    doc.setDrawColor(...colors.border);
    doc.line(sig1X, currentY + 22, sig1X + 55, currentY + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...colors.brandDark);
    doc.text(generatedBy, sig1X, currentY + 25.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...colors.textMuted);
    doc.text("System Administrator / Preparer", sig1X, currentY + 28.5);

    // Signature 2
    const sig2X = marginX + contentWidth - 70;
    doc.setDrawColor(...colors.border);
    doc.line(sig2X, currentY + 22, sig2X + 55, currentY + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...colors.brandDark);
    doc.text("Executive Board / Treasurer", sig2X, currentY + 25.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...colors.textMuted);
    doc.text("FundFlow Trust Audit Authority", sig2X, currentY + 28.5);

    currentY += 34;
  }

  /* ─────────────────────────────────────────────────────────────
     9. FOOTERS & PAGINATION ON ALL PAGES
  ───────────────────────────────────────────────────────────── */
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 10, marginX + contentWidth, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.textMuted);

    // Left brand disclaimer
    doc.text(
      `${organizationName} • Generated via FundFlow Smart Fund Management System`,
      marginX,
      pageHeight - 6.5
    );

    // Right Page Number
    doc.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, pageHeight - 6.5, {
      align: "right",
    });
  }

  // Generate clean filename
  const cleanOrg = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const fileName = `${cleanOrg}-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(fileName);
}

/**
 * Quick targeted export for Income Records
 */
export function exportIncomeReport(
  transactions: Transaction[],
  organizationName: string = "FundFlow Organization",
  generatedBy: string = "Administrator"
) {
  const incomeTxs = transactions.filter((t) => t.type === "income");
  exportOrganizationPDF({
    organizationName,
    reportTitle: "Fund Income & Receipts Statement",
    reportSubtitle: "Detailed breakdown of member contributions, donations, grants, and sponsorships",
    generatedBy,
    includeKPIs: true,
    includeMonthlyTrend: true,
    includeExpenseCategories: false,
    includeMembers: false,
    includeTransactions: true,
    transactionLimit: "all",
    includeAnnouncements: false,
    includeSignatures: true,
    transactions: incomeTxs,
  });
}

/**
 * Quick targeted export for Expense Records
 */
export function exportExpenseReport(
  transactions: Transaction[],
  organizationName: string = "FundFlow Organization",
  expensePie?: { name: string; value: number; color?: string }[],
  generatedBy: string = "Administrator"
) {
  const expenseTxs = transactions.filter((t) => t.type === "expense");
  exportOrganizationPDF({
    organizationName,
    reportTitle: "Fund Disbursements & Expense Statement",
    reportSubtitle: "Detailed statement of operational expenses, welfare benefits, events, and administrative costs",
    generatedBy,
    includeKPIs: true,
    includeMonthlyTrend: false,
    includeExpenseCategories: true,
    includeMembers: false,
    includeTransactions: true,
    transactionLimit: "all",
    includeAnnouncements: false,
    includeSignatures: true,
    transactions: expenseTxs,
    expensePie,
  });
}

/**
 * Quick targeted export for Member Directory
 */
export function exportMembersReport(
  members: Member[],
  organizationName: string = "FundFlow Organization",
  generatedBy: string = "Administrator"
) {
  exportOrganizationPDF({
    organizationName,
    reportTitle: "Member Directory & Contribution Ledger",
    reportSubtitle: "Complete directory of members, contact status, and cumulative contribution ledgers",
    generatedBy,
    includeKPIs: true,
    includeMonthlyTrend: false,
    includeExpenseCategories: false,
    includeMembers: true,
    includeTransactions: false,
    includeAnnouncements: false,
    includeSignatures: true,
    members,
  });
}

/* ─────────────────────────────────────────────────────────────
   10. OFFICIAL PAYMENT RECEIPT / VOUCHER (PDF)
───────────────────────────────────────────────────────────── */
export interface PaymentReceiptData {
  receiptNumber?: string;
  transactionId?: string;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  payerInitials?: string;
  memberId?: string;
  amount: number;
  category: string;
  description?: string;
  paymentMethod: "bKash" | "Nagad" | "Rocket" | "Credit/Debit Card" | "Bank Transfer" | string;
  paymentDate?: string;
  organizationName?: string;
  status?: "completed" | "verified" | "pending";
  remainingOutstanding?: number;
  totalContributions?: number;
}

export function exportPaymentReceiptPDF(data: PaymentReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm

  const colors = {
    brandDark: [9, 24, 42] as [number, number, number],
    brandPrimary: [11, 72, 50] as [number, number, number],
    brandAccent: [20, 199, 104] as [number, number, number],
    emeraldBg: [236, 253, 245] as [number, number, number],
    cardBg: [248, 250, 252] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    textDark: [15, 23, 42] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
    gold: [217, 119, 6] as [number, number, number],
  };

  const receiptNo = data.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const trxId = data.transactionId || `TRX-${data.paymentMethod.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-8)}`;
  const orgName = data.organizationName || "FundFlow Community Trust";
  const dateStr = data.paymentDate || new Date().toISOString().slice(0, 10);
  const formattedDate = fmtDateDisplay(dateStr);
  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  let currentY = 16;

  // 1. TOP HEADER BANNER
  doc.setFillColor(...colors.brandDark);
  doc.roundedRect(marginX, currentY, contentWidth, 32, 3, 3, "F");

  // Accent line
  doc.setFillColor(...colors.brandAccent);
  doc.rect(marginX, currentY + 31, contentWidth, 1.5, "F");

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("FUNDFLOW", marginX + 8, currentY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 225, 215);
  doc.text(orgName, marginX + 8, currentY + 18);
  doc.setFontSize(7.5);
  doc.text("Smart Fund Management & Ledger System • Official Financial Document", marginX + 8, currentY + 24);

  // Right receipt info badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX + contentWidth - 62, currentY + 5, 54, 22, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("ELECTRONIC RECEIPT", marginX + contentWidth - 35, currentY + 11, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...colors.textMuted);
  doc.text(`Receipt #: ${receiptNo}`, marginX + contentWidth - 35, currentY + 16, { align: "center" });
  doc.text(`Date: ${formattedDate} ${timeStr}`, marginX + contentWidth - 35, currentY + 21, { align: "center" });

  currentY += 40;

  // 2. RECEIPT TITLE & STATUS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colors.brandDark);
  doc.text("Payment Confirmation Voucher", marginX, currentY);

  // Status Pill
  doc.setFillColor(...colors.emeraldBg);
  doc.setDrawColor(...colors.brandAccent);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX + contentWidth - 44, currentY - 5, 44, 7.5, 3.5, 3.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("✓ VERIFIED & PAID", marginX + contentWidth - 22, currentY - 0.5, { align: "center" });

  currentY += 8;

  // 3. TWO CARDS: PAYER INFO & PAYMENT METADATA
  const cardW = (contentWidth - 6) / 2;
  const cardH = 38;

  // Payer Card
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, cardW, cardH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("PAYER / MEMBER DETAILS", marginX + 6, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.brandDark);
  doc.text(data.payerName, marginX + 6, currentY + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  if (data.payerEmail) doc.text(`Email: ${data.payerEmail}`, marginX + 6, currentY + 21);
  if (data.payerPhone) doc.text(`Phone: ${data.payerPhone}`, marginX + 6, currentY + 26);
  doc.text(`Member Status: Active Contributor`, marginX + 6, currentY + 31);

  // Metadata Card
  const card2X = marginX + cardW + 6;
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(card2X, currentY, cardW, cardH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("TRANSACTION DETAILS", card2X + 6, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  doc.text("Transaction ID:", card2X + 6, currentY + 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.brandDark);
  doc.text(trxId, card2X + 32, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Gateway Channel:", card2X + 6, currentY + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.brandDark);
  doc.text(data.paymentMethod, card2X + 32, currentY + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Payment Category:", card2X + 6, currentY + 26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.brandDark);
  doc.text(data.category, card2X + 32, currentY + 26);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Reconciliation:", card2X + 6, currentY + 32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.brandPrimary);
  doc.text("Auto-Reconciled to Fund", card2X + 32, currentY + 32);

  currentY += cardH + 10;

  // 4. ITEMIZATION TABLE
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    head: [["SL", "Item Description", "Category", "Payment Method", "Amount (BDT)"]],
    body: [
      [
        "01",
        data.description || `${data.category} - Official Contribution Deposit`,
        data.category,
        data.paymentMethod,
        fmtCurrency(data.amount),
      ],
    ],
    headStyles: {
      fillColor: colors.brandPrimary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3.5,
    },
    bodyStyles: {
      textColor: colors.textDark,
      fontSize: 8.5,
      cellPadding: 4,
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 31, halign: "right", fontStyle: "bold" },
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "body") {
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.2);
        doc.line(
          hookData.cell.x,
          hookData.cell.y + hookData.cell.height,
          hookData.cell.x + hookData.cell.width,
          hookData.cell.y + hookData.cell.height
        );
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 5. SUMMARY BOX & AMOUNT HIGHLIGHT
  const sumW = 80;
  const sumX = marginX + contentWidth - sumW;

  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(sumX, currentY, sumW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  doc.text("Subtotal:", sumX + 6, currentY + 8);
  doc.text(fmtCurrency(data.amount), sumX + sumW - 6, currentY + 8, { align: "right" });

  doc.text("Gateway & Processing Fee:", sumX + 6, currentY + 15);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("Tk 0.00 (Waived)", sumX + sumW - 6, currentY + 15, { align: "right" });

  doc.setDrawColor(...colors.border);
  doc.line(sumX + 4, currentY + 19, sumX + sumW - 4, currentY + 19);

  // Total Paid Big Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.brandDark);
  doc.text("Total Paid:", sumX + 6, currentY + 28);
  doc.setFontSize(12);
  doc.setTextColor(...colors.brandPrimary);
  doc.text(fmtCurrency(data.amount), sumX + sumW - 6, currentY + 28, { align: "right" });

  // Left Note & Security Badge
  const noteW = contentWidth - sumW - 8;
  doc.setFillColor(...colors.emeraldBg);
  doc.setDrawColor(...colors.brandAccent);
  doc.roundedRect(marginX, currentY, noteW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("SECURITY & INTEGRITY VERIFICATION", marginX + 6, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brandDark);
  doc.text("• Digital Token: " + `${trxId.slice(0, 14)}-SEC-AUTH`, marginX + 6, currentY + 13);
  doc.text("• Payment successfully settled into organizational treasury.", marginX + 6, currentY + 19);
  doc.text("• Ledger Hash: SHA256-" + trxId.slice(-6) + "98f41e0a2", marginX + 6, currentY + 25);
  if (data.remainingOutstanding !== undefined) {
    const outstandingText = data.remainingOutstanding > 0 
      ? `• Remaining Outstanding Dues: ${fmtCurrency(data.remainingOutstanding)}`
      : "• Outstanding Balance: Tk 0 (Account Fully Settled ✓)";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(data.remainingOutstanding > 0 ? 180 : 11, data.remainingOutstanding > 0 ? 83 : 72, data.remainingOutstanding > 0 ? 9 : 50);
    doc.text(outstandingText, marginX + 6, currentY + 31);
  }

  currentY += 46;

  // 6. OFFICIAL STAMP & SIGNATURES
  const stampX = marginX + 10;
  doc.setDrawColor(...colors.brandAccent);
  doc.setLineWidth(0.8);
  doc.roundedRect(stampX, currentY, 48, 26, 3, 3, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brandPrimary);
  doc.text("FUNDFLOW TRUST", stampX + 24, currentY + 7, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...colors.brandAccent);
  doc.text("★ PAID & VERIFIED ★", stampX + 24, currentY + 14, { align: "center" });
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(formattedDate, stampX + 24, currentY + 20, { align: "center" });

  // Signature 1
  const sig1X = marginX + contentWidth - 95;
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(sig1X, currentY + 19, sig1X + 40, currentY + 19);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brandDark);
  doc.text("Finance Officer", sig1X + 20, currentY + 23, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("Fund Administration", sig1X + 20, currentY + 26, { align: "center" });

  // Signature 2
  const sig2X = marginX + contentWidth - 45;
  doc.line(sig2X, currentY + 19, sig2X + 40, currentY + 19);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.brandDark);
  doc.text("Executive Treasurer", sig2X + 20, currentY + 23, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("Audit & Treasury Board", sig2X + 20, currentY + 26, { align: "center" });

  // 7. FOOTER
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.25);
  doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(
    "This is an electronically generated receipt verified by Smart Fund Management System. No physical signature required.",
    marginX,
    pageHeight - 7
  );
  doc.text("www.fundflow.org • Support: treasury@fundflow.org", marginX + contentWidth, pageHeight - 7, {
    align: "right",
  });

  const fileName = `Receipt-${receiptNo}-${dateStr}.pdf`;
  doc.save(fileName);
}

/* ─────────────────────────────────────────────────────────────
   11. OFFICIAL ANNUAL CONTRIBUTION CERTIFICATE (PDF)
───────────────────────────────────────────────────────────── */
export interface ContributionCertificateData {
  member: Member;
  organizationName?: string;
  year?: string;
  certificateId?: string;
  totalContributions?: number;
  issueDate?: string;
}

export function exportContributionCertificatePDF(data: ContributionCertificateData) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;

  const colors = {
    brandDark: [9, 24, 42] as [number, number, number],
    brandPrimary: [11, 72, 50] as [number, number, number],
    brandAccent: [20, 199, 104] as [number, number, number],
    gold: [180, 130, 20] as [number, number, number],
    goldLight: [253, 246, 227] as [number, number, number],
    cream: [255, 253, 248] as [number, number, number],
    border: [210, 180, 120] as [number, number, number],
    textDark: [15, 23, 42] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
  };

  const orgName = data.organizationName || "FundFlow Community Trust";
  const year = data.year || new Date().getFullYear().toString();
  const certId = data.certificateId || `CERT-FF-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = data.issueDate || new Date().toISOString().slice(0, 10);
  const totalAmount = data.totalContributions ?? data.member.contributions ?? 124000;

  // Background fill
  doc.setFillColor(...colors.cream);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer Border (Green)
  doc.setDrawColor(...colors.brandPrimary);
  doc.setLineWidth(2.5);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, "D");

  // Inner Border (Gold)
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.8);
  doc.rect(margin + 3.5, margin + 3.5, pageWidth - (margin + 3.5) * 2, pageHeight - (margin + 3.5) * 2, "D");

  // Fine Inner line
  doc.setLineWidth(0.3);
  doc.rect(margin + 5, margin + 5, pageWidth - (margin + 5) * 2, pageHeight - (margin + 5) * 2, "D");

  // Corner Ornaments
  const drawCorner = (x: number, y: number) => {
    doc.saveGraphicsState();
    doc.setFillColor(...colors.brandPrimary);
    doc.circle(x, y, 2.5, "F");
    doc.setFillColor(...colors.gold);
    doc.circle(x, y, 1.2, "F");
    doc.restoreGraphicsState();
  };
  drawCorner(margin + 5, margin + 5);
  drawCorner(pageWidth - (margin + 5), margin + 5);
  drawCorner(margin + 5, pageHeight - (margin + 5));
  drawCorner(pageWidth - (margin + 5), pageHeight - (margin + 5));

  // Top Title Banner
  let currentY = margin + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colors.gold);
  doc.text(orgName.toUpperCase(), pageWidth / 2, currentY, { align: "center" });

  currentY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("OFFICIAL FINANCIAL MERIT & RECOGNITION REGISTRY", pageWidth / 2, currentY, { align: "center" });

  currentY += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...colors.brandDark);
  doc.text("Certificate of Financial Contribution", pageWidth / 2, currentY, { align: "center" });

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colors.gold);
  doc.text("— AND MEMBER IN GOOD STANDING —", pageWidth / 2, currentY, { align: "center" });

  currentY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("This prestigious certificate is proudly presented to", pageWidth / 2, currentY, { align: "center" });

  // Member Name
  currentY += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...colors.brandPrimary);
  doc.text(data.member.name, pageWidth / 2, currentY, { align: "center" });

  // Name Underline
  const nameWidth = doc.getTextWidth(data.member.name);
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - nameWidth / 2 - 8, currentY + 2.5, pageWidth / 2 + nameWidth / 2 + 8, currentY + 2.5);

  currentY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.textDark);
  doc.text(
    `In sincere appreciation for their steadfast commitment and exemplary financial contributions to the organizational fund during ${year}.`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  // Big Amount Box
  currentY += 7;
  const boxW = 120;
  const boxH = 15;
  const boxX = (pageWidth - boxW) / 2;
  doc.setFillColor(...colors.goldLight);
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, currentY, boxW, boxH, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.brandDark);
  doc.text("Cumulative Verified Contribution:", boxX + 8, currentY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.brandPrimary);
  doc.text(fmtCurrency(totalAmount), boxX + boxW - 8, currentY + 10, { align: "right" });

  // Standing Badge
  currentY += boxH + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.brandAccent);
  doc.text("★ OFFICIAL STATUS: ACTIVE MEMBER IN HIGH STANDING (AUDIT VERIFIED) ★", pageWidth / 2, currentY, { align: "center" });

  // Signatures Row
  const sigY = pageHeight - margin - 22;

  // Signatory 1
  const s1X = margin + 30;
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.4);
  doc.line(s1X, sigY, s1X + 45, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.brandDark);
  doc.text("Executive President", s1X + 22.5, sigY + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("Board of Trustees", s1X + 22.5, sigY + 8, { align: "center" });

  // Seal in Center
  const sealX = pageWidth / 2;
  doc.setFillColor(...colors.brandPrimary);
  doc.circle(sealX, sigY - 3, 10, "F");
  doc.setDrawColor(...colors.gold);
  doc.setLineWidth(0.8);
  doc.circle(sealX, sigY - 3, 9, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL SEAL", sealX, sigY - 4.5, { align: "center" });
  doc.text(year, sealX, sigY - 1, { align: "center" });

  // Signatory 2
  const s2X = pageWidth - margin - 75;
  doc.line(s2X, sigY, s2X + 45, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.brandDark);
  doc.text("Chief Treasurer", s2X + 22.5, sigY + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textMuted);
  doc.text("Audit & Accounts Committee", s2X + 22.5, sigY + 8, { align: "center" });

  // Footer Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...colors.textMuted);
  doc.text(`Certificate No: ${certId} • Issue Date: ${fmtDateDisplay(issueDate)}`, margin + 10, pageHeight - margin - 4);
  doc.text(`Verified via FundFlow Smart Fund Management System`, pageWidth - margin - 10, pageHeight - margin - 4, { align: "right" });

  const fileName = `Certificate-${data.member.name.replace(/[^a-z0-9]/gi, "-")}-${year}.pdf`;
  doc.save(fileName);
}
