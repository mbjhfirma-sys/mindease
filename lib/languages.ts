// Shared list of language options — used by both the therapist specialization/language
// picker in Settings and the client intake quiz's language-preference step, so the
// values line up exactly for matching (lib/matching.ts does an exact string include,
// not a fuzzy compare).
export const LANGUAGE_SUGGESTIONS = [
  "English", "Spanish", "French", "German", "Portuguese", "Arabic",
  "Mandarin", "Danish", "Dutch", "Swedish", "Norwegian", "Italian",
];
