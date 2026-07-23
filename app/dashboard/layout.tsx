import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/dashboard/Sidebar";
import AchievementToastProvider from "@/components/dashboard/AchievementToast";
import GuidedTour from "@/components/tour/GuidedTour";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — YouMindo",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AchievementToastProvider>
      <div className="flex h-screen overflow-hidden bg-stone-50">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>

        <GuidedTour
          variant="client"
          welcomeEmoji="👋"
          welcomeBody="Let's take a real, hands-on tour of your dashboard — 11 stops, and a couple of them you'll actually get to try, not just look at."
          finishBody="You've seen where everything lives, and logged your first real mood check-in. Your 5 tasks for today are waiting whenever you're ready."
          finishCta="Start using YouMindo"
        />
      </div>
    </AchievementToastProvider>
  );
}
