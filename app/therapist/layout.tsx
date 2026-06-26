import TherapistHeader from "@/components/therapist/TherapistHeader";
import TherapistSidebar from "@/components/therapist/TherapistSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist Portal — MindEase Pro",
};

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <TherapistSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TherapistHeader />
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
