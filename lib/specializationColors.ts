const SPEC_COLORS: Record<string, string> = {
  anxiety:       "bg-violet-50 text-violet-700 border-violet-200",
  depression:    "bg-blue-50 text-blue-700 border-blue-200",
  trauma:        "bg-amber-50 text-amber-700 border-amber-200",
  ptsd:          "bg-amber-50 text-amber-700 border-amber-200",
  adhd:          "bg-yellow-50 text-yellow-700 border-yellow-200",
  grief:         "bg-teal-50 text-teal-700 border-teal-200",
  relationships: "bg-pink-50 text-pink-700 border-pink-200",
  cbt:           "bg-sage-50 text-sage-700 border-sage-200",
  dbt:           "bg-sage-50 text-sage-700 border-sage-200",
  mindfulness:   "bg-green-50 text-green-700 border-green-200",
  addiction:     "bg-orange-50 text-orange-700 border-orange-200",
  ocd:           "bg-red-50 text-red-700 border-red-200",
  stress:        "bg-stone-50 text-stone-700 border-stone-200",
};

export function specColor(s: string) {
  const key = s.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(SPEC_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-stone-50 text-stone-700 border-stone-200";
}
