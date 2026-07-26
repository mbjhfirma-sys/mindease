import PayoutsTab from "../_components/PayoutsTab";

export default function BusinessPayoutsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Payouts</h1>
      </div>
      <PayoutsTab />
    </div>
  );
}
