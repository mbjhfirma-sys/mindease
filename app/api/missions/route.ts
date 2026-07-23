import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BUILTIN_MISSIONS as DEFAULT_MISSIONS } from "@/lib/defaultMissions";

const DAILY_COUNT = 5;

// Deterministic daily shuffle: same user + same day = same 5 missions
function hashSeed(str: string): number {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  function rand() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayDayNumber(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000
  );
}

function pickDailyMissions<T extends { id: string }>(pool: T[], userId: string): T[] {
  const seed = hashSeed(`${userId}-${todayDayNumber()}`);
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, DAILY_COUNT);
}

type DefaultMission = typeof DEFAULT_MISSIONS[number];

// Clients must always see exactly `count` tasks. Therapist-assigned/pool
// missions take priority and are shown first; if there are fewer than
// `count` of them, fill the remainder with the deterministic daily default
// rotation (never duplicating an ID already present).
function padWithDefaults<T extends { id: string }>(existing: T[], userId: string, count: number): (T | DefaultMission)[] {
  if (existing.length >= count) return existing.slice(0, count);
  const existingIds = new Set(existing.map((m) => m.id));
  const seed = hashSeed(`${userId}-${todayDayNumber()}`);
  const shuffledDefaults = seededShuffle(DEFAULT_MISSIONS, seed);
  const fillers = shuffledDefaults.filter((m) => !existingIds.has(m.id)).slice(0, count - existing.length);
  return [...existing, ...fillers];
}

const completeSchema = z.object({
  missionId: z.string(),
  responseData: z.record(z.string(), z.any()).optional(),
});

async function ensureDefaultMissionsExist() {
  // Upsert (not createMany+skipDuplicates) so already-seeded rows stay in sync
  // with lib/defaultMissions.ts — e.g. activityType added after initial seeding.
  await Promise.all(
    DEFAULT_MISSIONS.map((m) => {
      const data = {
        title: m.title,
        description: m.description,
        category: m.category,
        duration: m.duration,
        xp: m.xp,
        recurring: m.recurring,
        activityType: m.activityType,
        therapistId: null,
      };
      return db.mission.upsert({ where: { id: m.id }, update: data, create: { id: m.id, ...data } });
    })
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { therapistId: true },
    });

    // Priority 1: missions individually assigned to this client by their therapist
    const personalAssignments = await db.missionAssignment.findMany({
      where: { clientId: userId },
      include: { mission: true },
      orderBy: { assignedAt: "asc" },
    });

    let poolRaw: typeof personalAssignments[number]["mission"][];
    let usingDefaults = false;

    if (personalAssignments.length > 0) {
      // Use personally assigned missions
      poolRaw = personalAssignments.map((a) => a.mission);
    } else {
      const hasTherapist = !!user?.therapistId;
      const therapistMissionCount = hasTherapist
        ? await db.mission.count({ where: { therapistId: user!.therapistId! } })
        : 0;

      usingDefaults = !hasTherapist || therapistMissionCount === 0;

      if (!usingDefaults) {
        // Priority 2: all missions from their therapist's pool
        poolRaw = await db.mission.findMany({
          where: { therapistId: user!.therapistId! },
          orderBy: { createdAt: "asc" },
        });
      } else {
        // Priority 3: default rotating missions
        await ensureDefaultMissionsExist();
        poolRaw = await db.mission.findMany({
          where: { therapistId: null },
          orderBy: { createdAt: "asc" },
        });
      }
    }

    // Pick today's daily set — always exactly DAILY_COUNT. Assigned/pool
    // missions are shown first; if there are fewer than DAILY_COUNT of them,
    // top up with the default rotation so the count never drops below 5.
    let dailyPool: (typeof poolRaw[number] | DefaultMission)[];
    if (personalAssignments.length > 0 || !usingDefaults) {
      if (poolRaw.length < DAILY_COUNT) await ensureDefaultMissionsExist();
      dailyPool = padWithDefaults(poolRaw, userId, DAILY_COUNT);
    } else {
      dailyPool = pickDailyMissions(DEFAULT_MISSIONS, userId);
    }

    const dailyIds = new Set(dailyPool.map((m) => m.id));

    const completionsToday = await db.missionCompletion.findMany({
      where: { userId, completedAt: { gte: todayStart }, missionId: { in: [...dailyIds] } },
      select: { missionId: true },
    });
    const completedIds = new Set(completionsToday.map((c) => c.missionId));
    const todayCompletions = completionsToday.length;

    const dbById = Object.fromEntries(poolRaw.map((m) => [m.id, m]));

    const missions = dailyPool.map((m) => {
      const src = dbById[m.id] ?? m;
      return {
        id: m.id,
        title: src.title,
        description: src.description,
        category: src.category,
        duration: src.duration,
        xp: src.xp,
        recurring: src.recurring,
        activityType: src.activityType ?? "generic",
        completed: completedIds.has(m.id),
      };
    });

    return NextResponse.json({ missions, completedToday: todayCompletions, dailyLimit: DAILY_COUNT });
  } catch {
    // DB unavailable — return today's 5 with no completion tracking
    const missions = pickDailyMissions(DEFAULT_MISSIONS, userId).map((m) => ({ ...m, completed: false }));
    return NextResponse.json({ missions, completedToday: 0, dailyLimit: DAILY_COUNT });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { missionId, responseData } = parsed.data;

  if (missionId.startsWith("default_")) {
    await ensureDefaultMissionsExist();
  }

  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  // Verify this mission is accessible to the user
  const missionUser = await db.user.findUnique({ where: { id: session.user.id }, select: { therapistId: true } });
  const isDefaultMission = mission.therapistId === null;
  const isTherapistMission = missionUser?.therapistId != null && mission.therapistId === missionUser.therapistId;
  const isPersonallyAssigned = !isDefaultMission && !isTherapistMission
    ? !!(await db.missionAssignment.findFirst({ where: { clientId: session.user.id, missionId } }))
    : false;
  if (!isDefaultMission && !isTherapistMission && !isPersonallyAssigned) {
    return NextResponse.json({ error: "Mission not available" }, { status: 403 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existingWhere = mission.recurring
    ? { userId: session.user.id, missionId, completedAt: { gte: todayStart } }
    : { userId: session.user.id, missionId };
  const existing = await db.missionCompletion.findFirst({ where: existingWhere });
  if (existing) return NextResponse.json({ ok: true, alreadyCompleted: true });

  await Promise.all([
    db.missionCompletion.create({ data: { userId: session.user.id, missionId, responseData } }),
    db.user.update({ where: { id: session.user.id }, data: { xp: { increment: mission.xp } } }),
  ]);

  return NextResponse.json({ ok: true, xpEarned: mission.xp });
}
