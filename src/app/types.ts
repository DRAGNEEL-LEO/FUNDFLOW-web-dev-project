export type Role = "admin" | "member";
export type AppPage = "landing" | "login" | "app";
export type View =
  | "login"
  | "dashboard"
  | "members"
  | "income"
  | "expenses"
  | "reports"
  | "announcements"
  | "welfare"
  | "ai"
  | "member-home";

export interface ProfileInfo {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: Role;
  initials: string;
}

export interface Member {
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

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  status: "completed" | "pending";
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  author: string;
}

export type WelfareCategory =
  | "Medical Emergency"
  | "Education Grant"
  | "Disaster Relief"
  | "Family Welfare"
  | "Community Project"
  | "Other";

export type WelfareStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "disbursed"
  | "rejected";

export type WelfareUrgency = "urgent" | "high" | "medium" | "low";

export interface WelfareRequest {
  id: string;
  orgId?: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  category: WelfareCategory;
  amountRequested: number;
  amountApproved?: number;
  urgency: WelfareUrgency;
  reason: string;
  bankOrWalletDetails: string;
  date: string;
  status: WelfareStatus;
  adminNote?: string;
  disbursedDate?: string;
  disbursedTxId?: string;
}
