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
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  author: string;
}
