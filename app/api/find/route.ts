import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// ── USA: NPPES NPI Registry ─────────────────────────────────────────────────

const NPPES_TAXONOMY: Record<string, string> = {
  therapist: "counselor",
  psychiatrist: "psychiatry",
  psychologist: "psychologist",
  "social-worker": "social work",
  "marriage-family": "Marriage & Family Therapist",
  "addiction-counselor": "addiction",
};

async function fetchUS(type: string, city: string, state: string, limit: number) {
  const params = new URLSearchParams({
    version: "2.1",
    taxonomy_description: NPPES_TAXONOMY[type] || "counselor",
    limit: String(limit),
    skip: "0",
  });
  if (city) params.set("city", city);
  if (state) params.set("state", state);

  const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("NPPES error");
  const data = await res.json();

  const providers = ((data.results ?? []) as Record<string, unknown>[]).map((r) => {
    const basic = (r.basic ?? {}) as Record<string, string>;
    const addresses = (r.addresses ?? []) as Record<string, string>[];
    const taxonomies = (r.taxonomies ?? []) as Record<string, string | boolean>[];
    const loc = addresses.find((a) => a.address_purpose === "LOCATION") ?? addresses[0] ?? {};
    const primary = taxonomies.find((t) => t.primary) ?? taxonomies[0] ?? {};
    const isInd = r.enumeration_type === "NPI-1";

    return {
      id: String(r.number),
      name: isInd
        ? `${basic.name_prefix ?? ""} ${basic.first_name ?? ""} ${basic.last_name ?? ""}`.trim()
        : (basic.organization_name ?? "Unknown"),
      credential: basic.credential ?? "",
      gender: basic.gender ?? "",
      specialty: (primary.desc as string) ?? type,
      address: {
        street: loc.address_1 ?? "",
        city: loc.city ?? "",
        state: loc.state ?? "",
        zip: (loc.postal_code ?? "").slice(0, 5),
      },
      phone: loc.telephone_number ?? "",
      website: "",
      lat: null as number | null,
      lon: null as number | null,
      isIndividual: isInd,
      country: "US",
      source: "NPPES National Provider Registry",
    };
  });

  return { count: data.result_count ?? providers.length, providers };
}

// ── Denmark: Nominatim + Overpass API ──────────────────────────────────────

// ── Denmark: Proff.dk (CVR-based Danish business registry) ──────────────────

// Maps provider type → Proff.dk industry name(s)
const PROFF_INDUSTRY: Record<string, string[]> = {
  therapist:           ["Psykoterapeuter", "Psykoterapi"],
  psychiatrist:        ["Psykiatere", "Psykiatri"],
  psychologist:        ["Psykologer"],
  "social-worker":     ["Socialrådgivere"],
  "marriage-family":   ["Parterapeuter", "Familieterapeuter"],
  "addiction-counselor":["Misbrugsbehandling"],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchDK(type: string, city: string, limit: number) {
  // Geocode city
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=dk&format=json&limit=1`,
    { headers: { "User-Agent": "YouMindo/1.0" }, next: { revalidate: 86400 } }
  );
  const geoData = (await geoRes.json()) as { lat: string; lon: string }[];
  if (!geoData.length) return { count: 0, providers: [] };
  const cityLat = parseFloat(geoData[0].lat);
  const cityLon = parseFloat(geoData[0].lon);

  // Fetch first 4 pages in parallel for each relevant industry on Proff.dk
  const industries = PROFF_INDUSTRY[type] ?? ["Psykoterapeuter"];
  const RADIUS_KM = 30;

  const fetchPage = async (industry: string, page: number) => {
    const url = `https://www.proff.dk/api/search?industry=${encodeURIComponent(industry)}&size=25&page=${page}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; YouMindo/1.0)", "Accept": "application/json" },
      next: { revalidate: 3600 },
    });
    const d = (await r.json()) as { companies?: Record<string, unknown>[] };
    return d.companies ?? [];
  };

  const allFetches = industries.flatMap((ind) => [1, 2, 3, 4].map((p) => fetchPage(ind, p)));
  const allPages = await Promise.all(allFetches);
  const allCompanies = allPages.flat() as Record<string, unknown>[];

  // Deduplicate by orgnr
  const seen = new Set<string>();
  const unique = allCompanies.filter((c) => {
    const id = String(c.orgnr ?? c.companyId ?? "");
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Filter by distance and sort nearest first
  type ProffCoord = { xcoordinate: number; ycoordinate: number };
  type ProffAddress = { addressLine?: string; zipCode?: string; postPlace?: string };
  type ProffCompany = Record<string, unknown> & { _dist?: number };

  const nearby = unique
    .filter((c: ProffCompany) => {
      const coords = (c.location as { coordinates?: ProffCoord[] })?.coordinates;
      if (!coords?.length) return false;
      const d = haversineKm(cityLat, cityLon, coords[0].ycoordinate, coords[0].xcoordinate);
      c._dist = d;
      return d <= RADIUS_KM;
    })
    .sort((a: ProffCompany, b: ProffCompany) => (a._dist ?? 99) - (b._dist ?? 99))
    .slice(0, limit) as ProffCompany[];

  const providers = nearby.map((c: ProffCompany) => {
    const addr = (c.visitorAddress ?? {}) as ProffAddress;
    const coords = (c.location as { coordinates?: ProffCoord[] })?.coordinates?.[0];
    const phone = (c.phone ?? c.mobile ?? "") as string;
    const proffUrl = `https://www.proff.dk/firma/${String(c.orgnr ?? "")}`;

    return {
      id: String(c.orgnr ?? c.companyId ?? ""),
      name: String(c.name ?? "Unknown"),
      credential: String(c.contactPerson ? (c.contactPerson as { role?: string }).role ?? "" : ""),
      gender: "",
      specialty: industries[0],
      address: {
        street: addr.addressLine ?? "",
        city: addr.postPlace ?? city,
        state: addr.zipCode ?? "",
        zip: addr.zipCode ?? "",
      },
      phone: phone.replace(/\s/g, ""),
      website: String(c.homePage ?? ""),
      lat: coords ? coords.ycoordinate : null,
      lon: coords ? coords.xcoordinate : null,
      isIndividual: false,
      country: "DK",
      source: "Proff.dk (CVR)",
      proffUrl,
      distKm: Math.round((c._dist ?? 0) * 10) / 10,
    };
  });

  return { count: providers.length, providers };
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const country = sp.get("country") ?? "us";
  const type = sp.get("type") ?? "therapist";
  const city = sp.get("city") ?? "";
  const state = sp.get("state") ?? "";
  const limit = Math.min(parseInt(sp.get("limit") ?? "20"), 50);

  try {
    const result = country === "dk"
      ? await fetchDK(type, city, limit)
      : await fetchUS(type, city, state, limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Find API error:", err);
    return NextResponse.json({ error: "Failed to fetch providers", providers: [], count: 0 }, { status: 500 });
  }
}
