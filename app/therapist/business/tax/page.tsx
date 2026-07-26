import TaxDocumentsTab from "../_components/TaxDocumentsTab";

export default function BusinessTaxDocumentsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Tax Documents</h1>
      </div>
      <TaxDocumentsTab />
    </div>
  );
}
