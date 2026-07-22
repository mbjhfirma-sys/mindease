export const PROFESSION_TYPES = [
  { id: "therapist", label: "Therapist", description: "Talk therapy, CBT, DBT" },
  { id: "psychiatrist", label: "Psychiatrist", description: "Medication management (MD)" },
  { id: "psychologist", label: "Psychologist", description: "Assessment & therapy (PhD/PsyD)" },
  { id: "social_worker", label: "Social Worker", description: "LCSW, holistic support" },
  { id: "marriage_family", label: "Marriage & Family", description: "Couples & family therapy" },
  { id: "addiction_counselor", label: "Addiction Specialist", description: "Substance use & recovery" },
] as const;

export type ProfessionTypeId = (typeof PROFESSION_TYPES)[number]["id"];

export function professionLabel(id: string | null | undefined): string {
  return PROFESSION_TYPES.find((p) => p.id === id)?.label ?? "Not specified";
}
