import {
  Users, ClipboardList,
  CalendarDays, BarChart3, MessageCircle, Wrench,
} from "lucide-react";
import type { TourStep } from "./types";

export const THERAPIST_TOUR: TourStep[] = [
  {
    Icon: Users,
    title: "Client Management",
    body: "Every client's mood history, journal (if shared), and task progress lives here — everything you need before a session, at a glance.",
    accent: "bg-sage-50 text-sage-700",
    route: "/therapist/clients",
    targetTour: "/therapist/clients",
  },
  {
    Icon: Wrench,
    title: "Task Builder",
    body: "Assign real, interactive CBT, DBT, and ACT exercises from a library of 100 templates — clients complete them as guided in-app activities, not checkboxes.",
    accent: "bg-amber-50 text-amber-700",
    route: "/therapist/missions",
    targetTour: "/therapist/missions",
  },
  {
    Icon: CalendarDays,
    title: "Scheduling",
    body: "Confirm session requests, reschedule, and set your weekly availability — all from one calendar.",
    accent: "bg-blue-50 text-blue-700",
    route: "/therapist/appointments",
    targetTour: "/therapist/appointments",
  },
  {
    Icon: MessageCircle,
    title: "Secure Messaging",
    body: "Message any client directly — click Message on their profile and you'll land straight in that conversation.",
    accent: "bg-pink-50 text-pink-700",
    route: "/therapist/messages",
    targetTour: "/therapist/messages",
  },
  {
    Icon: ClipboardList,
    title: "Community Groups",
    body: "Create and moderate peer support spaces for your clients — pin what matters, moderate discussion.",
    accent: "bg-teal-50 text-teal-700",
    route: "/therapist/community",
    targetTour: "/therapist/community",
  },
  {
    Icon: BarChart3,
    title: "Analytics",
    body: "Engagement trends and treatment outcomes across your whole caseload, in one dashboard.",
    accent: "bg-violet-50 text-violet-700",
    route: "/therapist/analytics",
    targetTour: "/therapist/analytics",
  },
];
