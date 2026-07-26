import OverviewTab from "./_components/OverviewTab";

export default function BusinessOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Overview</h1>
        <p className="text-sm text-stone-500 mt-1">Your earnings from client sessions on YouMindo.</p>
      </div>
      <OverviewTab />
    </div>
  );
}
