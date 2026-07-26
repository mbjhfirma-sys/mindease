import InvoicesTab from "../_components/InvoicesTab";

export default function BusinessInvoicesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Invoices</h1>
      </div>
      <InvoicesTab />
    </div>
  );
}
