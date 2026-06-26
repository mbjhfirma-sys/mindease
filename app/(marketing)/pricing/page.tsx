import Link from "next/link";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "A calm starting point for your mental health journey.",
    color: "bg-stone-50 border-stone-200",
    btnClass: "bg-stone-800 text-white hover:bg-stone-700",
    features: [
      "Access to 3 introductory course lessons",
      "Weekly article digest",
      "Community forum access",
      "Basic breathing exercises",
    ],
    notIncluded: ["Full course library", "Live group sessions", "1-on-1 coaching", "Personalized progress tracking"],
  },
  {
    name: "Growth",
    price: "$19",
    period: "/month",
    description: "Everything you need to build lasting mental health habits.",
    color: "bg-sage-700 border-sage-600",
    btnClass: "bg-white text-sage-800 hover:bg-sage-50",
    badge: "Most Popular",
    dark: true,
    features: [
      "Full access to 120+ course library",
      "Unlimited guided meditations",
      "Live weekly group sessions",
      "Progress tracking & journaling",
      "Downloadable worksheets",
      "Community + peer support groups",
    ],
    notIncluded: ["1-on-1 coaching sessions"],
  },
  {
    name: "Premium",
    price: "$49",
    period: "/month",
    description: "Deep, personalized support from certified professionals.",
    color: "bg-stone-50 border-stone-200",
    btnClass: "bg-sage-700 text-white hover:bg-sage-800",
    features: [
      "Everything in Growth",
      "4 x 1-on-1 coaching sessions/month",
      "Dedicated wellness coach",
      "Personalized treatment plan",
      "Priority support (24-hour response)",
      "Family & couples add-on available",
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="py-20 px-6 bg-cream text-center">
        <span className="text-sage-600 text-sm font-semibold uppercase tracking-wide">Pricing</span>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">
          Invest in Your Well-being
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Flexible plans for every step of your journey. Start free — upgrade when you're ready.
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20 bg-cream">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 ${plan.color} ${plan.dark ? "text-white" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-900 text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <h2 className={`text-sm font-bold uppercase tracking-wider mb-1 ${plan.dark ? "text-sage-200" : "text-stone-500"}`}>
                {plan.name}
              </h2>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm mb-1.5 ${plan.dark ? "text-sage-300" : "text-stone-400"}`}>{plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.dark ? "text-sage-200" : "text-stone-500"}`}>{plan.description}</p>

              <Link
                href="/register"
                className={`block text-center font-semibold text-sm px-5 py-3 rounded-full mb-8 transition-colors ${plan.btnClass}`}
              >
                {plan.price === "Free" ? "Get Started Free" : "Start 7-day Trial"}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.dark ? "text-sage-100" : "text-stone-600"}`}>
                    <span className="text-sage-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.dark ? "text-sage-400" : "text-stone-400"} line-through`}>
                    <span className="mt-0.5 flex-shrink-0">✕</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Compare table */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 text-stone-500 font-medium">Feature</th>
                  {["Basic", "Growth", "Premium"].map((p) => (
                    <th key={p} className="py-3 text-stone-800 font-bold text-center">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Course Library", "3 lessons", "Full 120+", "Full 120+"],
                  ["Guided Meditations", "✕", "✓", "✓"],
                  ["Live Group Sessions", "✕", "Weekly", "Weekly"],
                  ["1-on-1 Coaching", "✕", "✕", "4/month"],
                  ["Progress Tracking", "✕", "✓", "✓"],
                  ["Worksheets & Downloads", "✕", "✓", "✓"],
                  ["Community Access", "✓", "✓", "✓"],
                  ["Priority Support", "✕", "✕", "✓"],
                  ["Dedicated Coach", "✕", "✕", "✓"],
                ].map(([feature, ...vals]) => (
                  <tr key={feature} className="border-b border-stone-100">
                    <td className="py-3 text-stone-600">{feature}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="py-3 text-center text-stone-700">
                        {v === "✓" ? <span className="text-sage-600 font-bold">✓</span> :
                         v === "✕" ? <span className="text-stone-300">✕</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Money-back */}
      <section className="py-16 px-6 bg-cream text-center">
        <div className="max-w-lg mx-auto">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">30-Day Money-Back Guarantee</h2>
          <p className="text-stone-500 mb-6">
            Try MindEase risk-free. If you're not completely satisfied in the first 30 days, we'll refund you fully — no questions asked.
          </p>
          <Link
            href="/register"
            className="inline-flex bg-sage-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-sage-800 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </>
  );
}
