"use client";

import BreathingExercise from "./exercises/BreathingExercise";
import BodyScanExercise from "./exercises/BodyScanExercise";
import GratitudeExercise from "./exercises/GratitudeExercise";
import GroundingExercise from "./exercises/GroundingExercise";
import ProgressiveMuscleRelaxation from "./exercises/ProgressiveMuscleRelaxation";
import BoxBreathingExercise from "./exercises/BoxBreathingExercise";
import ThoughtReframeExercise from "./exercises/ThoughtReframeExercise";
import ValuesCardSortExercise from "./exercises/ValuesCardSortExercise";
import FeelingsWheelExercise from "./exercises/FeelingsWheelExercise";
import WorryJarExercise from "./exercises/WorryJarExercise";
import LovingKindnessExercise from "./exercises/LovingKindnessExercise";
import CbtTriangleExercise from "./exercises/CbtTriangleExercise";
import UrgeSurfingExercise from "./exercises/UrgeSurfingExercise";
import SelfCompassionExercise from "./exercises/SelfCompassionExercise";

export type ExerciseType =
  | "breathing" | "bodyscan" | "gratitude" | "grounding"
  | "pmr" | "boxbreathing" | "reframe" | "values" | "feelingswheel"
  | "worryjar" | "lovingkindness" | "cbttriangle" | "urgesurf" | "selfcompassion";

interface Props {
  title: string;
  exerciseType: ExerciseType;
  onComplete: () => void;
}

export const EXERCISE_META: Record<ExerciseType, { label: string; emoji: string; Component: React.ComponentType<{ onComplete: () => void }> }> = {
  breathing:      { label: "Breathing Exercise",          emoji: "🌬️", Component: BreathingExercise },
  bodyscan:       { label: "Body Scan",                   emoji: "🧘", Component: BodyScanExercise },
  gratitude:      { label: "Gratitude Practice",          emoji: "🌻", Component: GratitudeExercise },
  grounding:      { label: "Grounding Exercise",           emoji: "⚓", Component: GroundingExercise },
  pmr:            { label: "Progressive Muscle Relaxation", emoji: "💪", Component: ProgressiveMuscleRelaxation },
  boxbreathing:   { label: "Box Breathing",               emoji: "⬜", Component: BoxBreathingExercise },
  reframe:        { label: "Thought Reframe",             emoji: "🔄", Component: ThoughtReframeExercise },
  values:         { label: "Values Card Sort",            emoji: "🧭", Component: ValuesCardSortExercise },
  feelingswheel:  { label: "Feelings Wheel",              emoji: "🎡", Component: FeelingsWheelExercise },
  worryjar:       { label: "Worry Jar",                   emoji: "🫙", Component: WorryJarExercise },
  lovingkindness: { label: "Loving-Kindness Meditation",  emoji: "💗", Component: LovingKindnessExercise },
  cbttriangle:    { label: "Thought-Feeling-Behavior",    emoji: "🔺", Component: CbtTriangleExercise },
  urgesurf:       { label: "Urge Surfing",                emoji: "🌊", Component: UrgeSurfingExercise },
  selfcompassion: { label: "Self-Compassion Break",       emoji: "🤍", Component: SelfCompassionExercise },
};

export default function ExerciseLesson({ title, exerciseType, onComplete }: Props) {
  const meta = EXERCISE_META[exerciseType];
  const ActiveExercise = meta.Component;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center text-xl">
          {meta.emoji}
        </div>
        <div>
          <div className="text-xs font-semibold text-sage-600 uppercase tracking-wide">{meta.label}</div>
          <h2 className="font-bold text-stone-800">{title}</h2>
        </div>
      </div>

      <ActiveExercise onComplete={onComplete} />
    </div>
  );
}
