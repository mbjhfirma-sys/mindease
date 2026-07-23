import TherapistHeader from "@/components/therapist/TherapistHeader";
import TherapistSidebar from "@/components/therapist/TherapistSidebar";
import GuidedTour from "@/components/tour/GuidedTour";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist Portal — YouMindo Pro",
};

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <TherapistSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TherapistHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-6">
          {children}
        </main>
      </div>

      <GuidedTour
        variant="therapist"
        welcomeBody="Let's take a quick, hands-on tour of your therapist portal — we'll walk through the real pages together."
        finishBody="You know your way around now. Your clients are waiting — let's get to work."
        finishCta="Enter my portal"
      />
    </div>
  );
}
