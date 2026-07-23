import type { LucideIcon } from "lucide-react";

export type TourStep = {
  Icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  route: string;
  targetTour: string;
  /** Optional embedded interactive widget rendered inside the tour panel, below the body text. */
  Extra?: React.ComponentType;
};
