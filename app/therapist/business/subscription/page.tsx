import SubscriptionTab from "../_components/SubscriptionTab";

export default function BusinessSubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Subscription</h1>
      </div>
      <SubscriptionTab />
    </div>
  );
}
