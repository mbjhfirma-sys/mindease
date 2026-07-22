// Canonical list of client-concern / therapist-specialization tags. Used both by
// the client intake quiz (what brings you here) and the therapist specialization
// picker in Settings, so a client's selected concerns and a therapist's stored
// `specializations` are directly comparable strings — no separate mapping table.
export const SPECIALIZATIONS = [
  { id: "Anxiety", emoji: "😰", description: "Worry, panic, phobias" },
  { id: "Depression", emoji: "💙", description: "Sadness, hopelessness" },
  { id: "Trauma & PTSD", emoji: "🛡️", description: "Past trauma, flashbacks" },
  { id: "ADHD", emoji: "⚡", description: "Focus, hyperactivity" },
  { id: "Addiction", emoji: "🔗", description: "Substance use, behaviors" },
  { id: "Grief & Loss", emoji: "🌧️", description: "Loss, bereavement" },
  { id: "Relationships", emoji: "💑", description: "Couples, family, social" },
  { id: "Eating Disorders", emoji: "🌱", description: "ED recovery, body image" },
  { id: "OCD", emoji: "🔄", description: "Obsessions, compulsions" },
  { id: "Anger Management", emoji: "🌋", description: "Anger management" },
  { id: "Stress & Burnout", emoji: "🔥", description: "Work stress, burnout" },
  { id: "Bipolar Disorder", emoji: "🌊", description: "Mood episodes" },
  { id: "Sleep Issues", emoji: "🌙", description: "Insomnia, sleep anxiety" },
  { id: "Self-Esteem", emoji: "🌟", description: "Confidence, identity" },
  { id: "Couples Therapy", emoji: "💞", description: "Relationship-focused work" },
  { id: "Family Therapy", emoji: "👪", description: "Family systems work" },
] as const;

export const SPECIALIZATION_LABELS = SPECIALIZATIONS.map((s) => s.id);

// Treatment modalities (how a therapist works, not what a client is dealing with) —
// shown only as extra suggestion chips in the therapist's own specialization picker,
// never part of the client intake quiz or the matching score.
export const MODALITY_SUGGESTIONS = ["CBT", "DBT", "Mindfulness", "ACT", "Psychodynamic"];

