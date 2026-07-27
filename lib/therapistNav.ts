import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Calendar, Wrench, Globe, MessageCircle, BarChart2,
  TrendingUp, CreditCard, Wallet, Receipt, FileText, Gift,
} from "lucide-react";

export type NavItem = { href: string; label: string; Icon: LucideIcon; exact?: boolean };

export const CLIENT_NAV: NavItem[] = [
  { href: "/therapist",              label: "Overview",     Icon: LayoutDashboard, exact: true },
  { href: "/therapist/clients",      label: "Clients",      Icon: Users },
  { href: "/therapist/appointments", label: "Appointments", Icon: Calendar },
  { href: "/therapist/missions",     label: "Task Builder", Icon: Wrench },
  { href: "/therapist/community",    label: "Community",    Icon: Globe },
  { href: "/therapist/messages",     label: "Messages",     Icon: MessageCircle },
  { href: "/therapist/analytics",    label: "Analytics",    Icon: BarChart2 },
];

export const BUSINESS_GROUP: { label: string; Icon: LucideIcon } = { label: "Business", Icon: TrendingUp };

export const BUSINESS_SUBNAV: NavItem[] = [
  { href: "/therapist/business",              label: "Overview",      Icon: LayoutDashboard, exact: true },
  { href: "/therapist/business/subscription", label: "Subscription",  Icon: CreditCard },
  { href: "/therapist/business/payouts",      label: "Payouts",       Icon: Wallet },
  { href: "/therapist/business/invoices",     label: "Invoices",      Icon: Receipt },
  { href: "/therapist/business/tax",          label: "Tax Documents", Icon: FileText },
  { href: "/therapist/business/affiliate",    label: "Affiliate",     Icon: Gift },
];
