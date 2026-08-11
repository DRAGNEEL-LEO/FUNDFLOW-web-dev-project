import type { Announcement, Member, Transaction } from "./types";

export const SEED_MEMBERS: Member[] = [
  { id: "1", name: "Amara Nwosu", email: "amara@fundflow.org", role: "member", initials: "AN", joined: "2023-01-15", status: "active", contributions: 124000, outstanding: 0, phone: "+880 1712 345678" },
  { id: "2", name: "James Okonkwo", email: "james@fundflow.org", role: "member", initials: "JO", joined: "2023-02-10", status: "active", contributions: 98000, outstanding: 12000, phone: "+880 1811 456789" },
  { id: "3", name: "Fatima Al-Hassan", email: "fatima@fundflow.org", role: "member", initials: "FA", joined: "2022-11-05", status: "active", contributions: 156000, outstanding: 0, phone: "+880 1911 567890" },
  { id: "4", name: "David Chen", email: "david@fundflow.org", role: "member", initials: "DC", joined: "2023-03-20", status: "inactive", contributions: 32000, outstanding: 24000, phone: "+880 1611 678901" },
  { id: "5", name: "Ngozi Adeyemi", email: "ngozi@fundflow.org", role: "member", initials: "NA", joined: "2023-01-01", status: "active", contributions: 110000, outstanding: 5000, phone: "+880 1511 789012" },
  { id: "6", name: "Kwame Asante", email: "kwame@fundflow.org", role: "member", initials: "KA", joined: "2022-09-14", status: "active", contributions: 182000, outstanding: 0, phone: "+880 1411 890123" },
  { id: "7", name: "Priya Sharma", email: "priya@fundflow.org", role: "member", initials: "PS", joined: "2023-04-08", status: "active", contributions: 74000, outstanding: 8000, phone: "+880 1311 901234" },
  { id: "8", name: "Emmanuel Diallo", email: "emmanuel@fundflow.org", role: "member", initials: "ED", joined: "2023-05-22", status: "inactive", contributions: 18000, outstanding: 36000, phone: "+880 1211 012345" },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "income", category: "Monthly Contribution", amount: 50000, description: "March member contributions", date: "2024-03-01", reference: "MC-2024-03", status: "completed" },
  { id: "t2", type: "expense", category: "Operations", amount: 12000, description: "Office supplies and printing", date: "2024-03-03", reference: "EXP-001", status: "completed" },
  { id: "t3", type: "income", category: "Donation", amount: 85000, description: "Corporate donation — TechCorp Ltd", date: "2024-03-05", reference: "DON-2024-01", status: "completed" },
  { id: "t4", type: "expense", category: "Events", amount: 34000, description: "Annual general meeting venue hire", date: "2024-03-08", reference: "EXP-002", status: "completed" },
  { id: "t5", type: "income", category: "Membership Fee", amount: 24000, description: "New member registration — Q1", date: "2024-03-10", reference: "MF-2024-01", status: "completed" },
  { id: "t6", type: "expense", category: "Welfare", amount: 18000, description: "Medical assistance benefit", date: "2024-03-12", reference: "EXP-003", status: "completed" },
  { id: "t7", type: "income", category: "Sponsorship", amount: 120000, description: "PrimeBank Q1 sponsorship", date: "2024-03-15", reference: "SP-2024-01", status: "completed" },
  { id: "t8", type: "expense", category: "Admin", amount: 6500, description: "Internet and utility bills", date: "2024-03-18", reference: "EXP-004", status: "completed" },
  { id: "t9", type: "income", category: "Monthly Contribution", amount: 52000, description: "April member contributions", date: "2024-04-01", reference: "MC-2024-04", status: "completed" },
  { id: "t10", type: "expense", category: "Education", amount: 22000, description: "Member training workshop", date: "2024-04-05", reference: "EXP-005", status: "completed" },
  { id: "t11", type: "income", category: "Donation", amount: 30000, description: "Anonymous donor contribution", date: "2024-04-09", reference: "DON-2024-02", status: "completed" },
  { id: "t12", type: "expense", category: "Operations", amount: 9000, description: "Software subscriptions renewal", date: "2024-04-14", reference: "EXP-006", status: "pending" },
];

export const MONTHLY_DATA = [
  { month: "Oct", income: 184000, expenses: 72000 },
  { month: "Nov", income: 210000, expenses: 89000 },
  { month: "Dec", income: 195000, expenses: 124000 },
  { month: "Jan", income: 228000, expenses: 93000 },
  { month: "Feb", income: 241000, expenses: 108000 },
  { month: "Mar", income: 331000, expenses: 80500 },
  { month: "Apr", income: 282000, expenses: 113000 },
];

export const EXPENSE_PIE = [
  { name: "Operations", value: 21000, color: "#0B4832" },
  { name: "Events", value: 34000, color: "#14C768" },
  { name: "Welfare", value: 36000, color: "#F59E0B" },
  { name: "Education", value: 22000, color: "#6366F1" },
  { name: "Admin", value: 18500, color: "#EC4899" },
];

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Q2 Budget Review Meeting", body: "All members are invited to the quarterly budget review meeting on April 28th at 3:00 PM. Attendance is mandatory for all executive members. Agenda will be shared 48 hours prior.", date: "2024-04-18", priority: "high", author: "Admin Office" },
  { id: "a2", title: "Outstanding Contributions Reminder", body: "Members with outstanding balances are reminded to clear payments before April 30th to avoid a 5% late fee. Contact the treasurer to arrange a payment plan if needed.", date: "2024-04-15", priority: "high", author: "Treasurer" },
  { id: "a3", title: "Annual Fundraising Dinner — May 10th", body: "Our annual fundraising dinner will be held at the Dhaka Convention Center. Tickets are Tk 5,000 each. All proceeds fund the community welfare programme. RSVP by May 5th.", date: "2024-04-12", priority: "medium", author: "Events Committee" },
  { id: "a4", title: "Welcome to March Cohort Members", body: "Please join us in welcoming 6 new members who joined in March 2024. New member orientation is scheduled for April 22nd at 10 AM. All members are encouraged to attend.", date: "2024-04-10", priority: "low", author: "Admin Office" },
];
