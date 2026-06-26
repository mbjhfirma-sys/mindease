"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { analyticsData, therapistClients } from "@/lib/mockData";

type DateRange = "7d" | "30d" | "90d";
type EngMetric = "both" | "sessions" | "missions";
type SortDir = "desc" | "asc";
type RiskFilter = "all" | "low" | "medium" | "high";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Simulated data per date range
const ENGAGEMENT: Record<DateRange, typeof analyticsData.weeklyEngagement> = {
  "7d": analyticsData.weeklyEngagement,
  "30d": analyticsData.weeklyEngagement.map((d) => ({
    ...d, sessions: Math.round(d.sessions * 4.2), missions: Math.round(d.missions * 4.5),
  })),
  "90d": analyticsData.weeklyEngagement.map((d) => ({
    ...d, sessions: Math.round(d.sessions * 13), missions: Math.round(d.missions * 13.5),
  })),
};

const ATTENDANCE: Record<DateRange, { total: number; attended: number; cancelled: number; noShow: number }> = {
  "7d":  { total: 26,  attended: 22, cancelled: 3,  noShow: 1  },
  "30d": { total: 104, attended: 88, cancelled: 11, noShow: 5  },
  "90d": { total: 312, attended: 264,cancelled: 31, noShow: 17 },
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [engMetric, setEngMetric] = useState<EngMetric>("both");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [highlightedClient, setHighlightedClient] = useState<string | null>(null);

  // Mood chart hover: { clientId, dayIdx }
  const [moodHover, setMoodHover] = useState<{ id: string; day: number } | null>(null);
  // Engagement hover: day index
  const [engHover, setEngHover] = useState<number | null>(null);
  // Completion bar hover
  const [compHover, setCompHover] = useState<string | null>(null);
  // Risk bar hover
  const [riskHover, setRiskHover] = useState<string | null>(null);
  // Attendance hover
  const [attendHover, setAttendHover] = useState<string | null>(null);

  const engagement = ENGAGEMENT[dateRange];
  const attendance = ATTENDANCE[dateRange];
  const attendanceRate = ((attendance.attended / attendance.total) * 100).toFixed(1);

  // Derived metrics
  const visibleClients = therapistClients.filter(
    (c) => riskFilter === "all" || c.riskLevel === riskFilter
  );
  const avgMood = visibleClients.reduce((s, c) => s + c.moodAvg, 0) / (visibleClients.length || 1);
  const avgCompletion = visibleClients.reduce((s, c) => s + c.missionCompletion, 0) / (visibleClients.length || 1);

  const sortedByCompletion = [...therapistClients].sort((a, b) =>
    sortDir === "desc" ? b.missionCompletion - a.missionCompletion : a.missionCompletion - b.missionCompletion
  );

  const maxSessions = Math.max(...engagement.map((d) => d.sessions));
  const maxMissions = Math.max(...engagement.map((d) => d.missions));

  const RISK_COLORS: Record<string, string> = {
    low: "border-stone-200 text-stone-400",
    medium: "border-amber-200 text-amber-600",
    high: "border-red-200 text-red-600",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Analytics</h1>
          <p className="text-sm text-stone-500 mt-1">Client engagement and progress insights</p>
        </div>
        {/* Date range selector */}
        <div className="flex bg-stone-100 rounded-lg p-1 gap-1">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                dateRange === r
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Risk filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-stone-400">Filter by risk:</span>
        {(["all", "low", "medium", "high"] as RiskFilter[]).map((r) => (
          <button
            key={r}
            onClick={() => setRiskFilter(riskFilter === r ? "all" : r)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize transition-all ${
              riskFilter === r
                ? r === "high"
                  ? "bg-red-600 text-white border-red-600"
                  : r === "medium"
                  ? "bg-amber-500 text-white border-amber-500"
                  : r === "low"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-stone-900 text-white border-stone-900"
                : r === "high"
                ? "border-red-200 text-red-500 hover:bg-red-50"
                : r === "medium"
                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                : "border-stone-200 text-stone-500 hover:bg-stone-50"
            }`}
          >
            {r === "all" ? "All clients" : r}
          </button>
        ))}
        {riskFilter !== "all" && (
          <span className="text-xs text-stone-400 ml-1">
            Showing {visibleClients.length} of {therapistClients.length} clients
          </span>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active clients", value: visibleClients.length, sub: riskFilter !== "all" ? `${riskFilter} risk` : "all risk levels" },
          { label: "Avg mood score", value: `${avgMood.toFixed(1)} / 5`, sub: `across ${visibleClients.length} clients` },
          { label: "Avg task completion", value: `${Math.round(avgCompletion)}%`, sub: "this period" },
          { label: "Session attendance", value: `${attendanceRate}%`, sub: `${attendance.attended} / ${attendance.total} sessions` },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-200 transition-colors"
          >
            <div className="text-2xl font-semibold text-stone-900">{s.value}</div>
            <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Mood trends */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900">7-Day Mood Trends</h3>
          <span className="text-xs text-stone-400">Hover bars · Click name to view client</span>
        </div>
        {visibleClients.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center">No clients match the selected risk filter.</p>
        ) : (
          <div className="space-y-4">
            {visibleClients.map((client) => {
              const isHighlighted = highlightedClient === null || highlightedClient === client.id;
              return (
                <div
                  key={client.id}
                  className={`flex items-center gap-4 rounded-lg transition-all ${
                    !isHighlighted ? "opacity-30" : ""
                  }`}
                  onMouseEnter={() => setHighlightedClient(client.id)}
                  onMouseLeave={() => setHighlightedClient(null)}
                >
                  <Link
                    href={`/therapist/clients/${client.id}`}
                    className="w-28 flex-shrink-0 text-xs font-medium text-stone-700 hover:text-stone-900 hover:underline underline-offset-2 transition-colors truncate"
                  >
                    {client.name.split(" ")[0]}
                  </Link>

                  <div className="flex items-end gap-0.5 h-8 flex-1 relative">
                    {client.moodHistory.map((score, i) => {
                      const isHov = moodHover?.id === client.id && moodHover.day === i;
                      return (
                        <div key={i} className="flex-1 relative group/bar">
                          {/* Tooltip */}
                          {isHov && (
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                              {DAYS[i]} · {score}/5
                            </div>
                          )}
                          <div
                            className="w-full rounded-t-sm cursor-pointer transition-colors"
                            style={{
                              height: `${(score / 5) * 28}px`,
                              minHeight: "3px",
                              backgroundColor: isHov ? "#44403c" : "#1c1917",
                              opacity: isHighlighted ? 0.85 : 0.4,
                            }}
                            onMouseEnter={() => setMoodHover({ id: client.id, day: i })}
                            onMouseLeave={() => setMoodHover(null)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-shrink-0 text-right min-w-[52px]">
                    <div className="text-sm font-semibold text-stone-900">{client.moodAvg.toFixed(1)}</div>
                    <div className="text-[9px] text-stone-400">avg</div>
                  </div>
                  <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium flex-shrink-0 capitalize ${RISK_COLORS[client.riskLevel]}`}>
                    {client.riskLevel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task completion */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900">Task Completion Rates</h3>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            {sortDir === "desc" ? <ArrowDown size={11} /> : sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowUpDown size={11} />}
            {sortDir === "desc" ? "Highest first" : "Lowest first"}
          </button>
        </div>
        <div className="space-y-3">
          {sortedByCompletion.map((client) => {
            const isHov = compHover === client.id;
            return (
              <div
                key={client.id}
                className="flex items-center gap-3"
                onMouseEnter={() => setCompHover(client.id)}
                onMouseLeave={() => setCompHover(null)}
              >
                <Link
                  href={`/therapist/clients/${client.id}`}
                  className="text-xs text-stone-700 hover:text-stone-900 hover:underline underline-offset-2 w-28 flex-shrink-0 truncate transition-colors"
                >
                  {client.name.split(" ")[0]}
                </Link>
                <div className="relative flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${client.missionCompletion}%`,
                      backgroundColor: isHov ? "#44403c" : "#1c1917",
                    }}
                  />
                  {/* Tooltip on hover */}
                  {isHov && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 bg-stone-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded pointer-events-none z-10 whitespace-nowrap"
                      style={{ left: `${Math.min(client.missionCompletion, 85)}%`, transform: "translate(-50%, -150%)" }}
                    >
                      {client.missionCompletion}% complete
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold w-8 text-right flex-shrink-0 transition-colors ${
                    isHov ? "text-stone-900" : "text-stone-600"
                  }`}
                >
                  {client.missionCompletion}%
                </span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium flex-shrink-0 capitalize ${RISK_COLORS[client.riskLevel]}`}>
                  {client.riskLevel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly engagement */}
      <div className="bg-white border border-stone-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900">Weekly Engagement</h3>
          <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
            {(["both", "sessions", "missions"] as EngMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setEngMetric(m)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize transition-colors ${
                  engMetric === m
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {m === "both" ? "Both" : m === "sessions" ? "Sessions" : "Tasks"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3 h-28 relative">
          {engagement.map((day, i) => {
            const isHov = engHover === i;
            const sessionH = maxSessions > 0 ? (day.sessions / maxSessions) * 80 : 0;
            const missionH = maxMissions > 0 ? (day.missions / maxMissions) * 60 : 0;
            return (
              <div
                key={day.day}
                className="flex-1 flex flex-col items-center gap-1.5 relative"
                onMouseEnter={() => setEngHover(i)}
                onMouseLeave={() => setEngHover(null)}
              >
                {/* Tooltip */}
                {isHov && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none leading-relaxed">
                    {engMetric !== "missions" && <div>{day.sessions} session{day.sessions !== 1 ? "s" : ""}</div>}
                    {engMetric !== "sessions" && <div>{day.missions} tasks</div>}
                  </div>
                )}
                <div className="w-full flex flex-col items-center gap-0.5">
                  {(engMetric === "both" || engMetric === "sessions") && (
                    <div
                      className="w-full rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${sessionH}px`,
                        minHeight: day.sessions > 0 ? "3px" : "0",
                        backgroundColor: isHov ? "#57534e" : "#1c1917",
                      }}
                    />
                  )}
                  {(engMetric === "both" || engMetric === "missions") && (
                    <div
                      className="w-full rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${missionH}px`,
                        minHeight: day.missions > 0 ? "3px" : "0",
                        backgroundColor: isHov ? "#a8a29e" : "#d6d3d1",
                      }}
                    />
                  )}
                </div>
                <span className={`text-[9px] transition-colors ${isHov ? "text-stone-700 font-medium" : "text-stone-400"}`}>
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-stone-50">
          {(engMetric === "both" || engMetric === "sessions") && (
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 bg-stone-900 rounded-sm" />Sessions
            </span>
          )}
          {(engMetric === "both" || engMetric === "missions") && (
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 bg-stone-300 rounded-sm" />Tasks completed
            </span>
          )}
          <span className="ml-auto text-xs text-stone-400">
            {dateRange === "7d" ? "This week" : dateRange === "30d" ? "Last 30 days" : "Last 90 days"}
          </span>
        </div>
      </div>

      {/* Risk & attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk distribution */}
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">Risk Level Distribution</h3>
            {riskFilter !== "all" && (
              <button
                onClick={() => setRiskFilter("all")}
                className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="space-y-3">
            {[
              { label: "Low", key: "low" as const, count: analyticsData.riskBreakdown.low, color: "bg-stone-900" },
              { label: "Medium", key: "medium" as const, count: analyticsData.riskBreakdown.medium, color: "bg-amber-400" },
              { label: "High", key: "high" as const, count: analyticsData.riskBreakdown.high, color: "bg-red-500" },
            ].map((r) => {
              const isActive = riskFilter === r.key;
              const isHov = riskHover === r.label;
              return (
                <button
                  key={r.label}
                  className={`w-full flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                    isActive ? "bg-stone-50" : isHov ? "bg-stone-50/50" : ""
                  }`}
                  onClick={() => setRiskFilter(riskFilter === r.key ? "all" : r.key)}
                  onMouseEnter={() => setRiskHover(r.label)}
                  onMouseLeave={() => setRiskHover(null)}
                  title={`Click to filter by ${r.label.toLowerCase()} risk`}
                >
                  <span className={`text-xs w-14 text-left flex-shrink-0 transition-colors ${isActive ? "font-semibold text-stone-900" : "text-stone-500"}`}>
                    {r.label}
                  </span>
                  <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${r.color}`}
                      style={{ width: `${(r.count / therapistClients.length) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-4 text-right flex-shrink-0 transition-colors ${isActive ? "text-stone-900" : "text-stone-600"}`}>
                    {r.count}
                  </span>
                  {isActive && (
                    <span className="text-[9px] text-stone-400 ml-1 flex-shrink-0">filtered</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-50">
            Click a row to filter all charts by risk level
          </p>
        </div>

        {/* Session attendance */}
        <div className="bg-white border border-stone-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">
            Session Attendance
            <span className="text-xs font-normal text-stone-400 ml-2">
              {dateRange === "7d" ? "7 days" : dateRange === "30d" ? "30 days" : "90 days"}
            </span>
          </h3>
          <div className="space-y-3">
            {[
              { label: "Attended",  count: attendance.attended,  color: "bg-stone-900" },
              { label: "Cancelled", count: attendance.cancelled, color: "bg-amber-400" },
              { label: "No-show",   count: attendance.noShow,    color: "bg-red-400"   },
            ].map((r) => {
              const isHov = attendHover === r.label;
              const pct = ((r.count / attendance.total) * 100).toFixed(1);
              return (
                <div
                  key={r.label}
                  className="flex items-center gap-3"
                  onMouseEnter={() => setAttendHover(r.label)}
                  onMouseLeave={() => setAttendHover(null)}
                >
                  <span className="text-xs text-stone-500 w-16 flex-shrink-0">{r.label}</span>
                  <div className="relative flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${r.color}`}
                      style={{ width: `${(r.count / attendance.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-stone-700 w-14 text-right flex-shrink-0">
                    {r.count}
                    {isHov && (
                      <span className="text-stone-400 font-normal ml-1">({pct}%)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-50 flex items-center justify-between">
            <p className="text-xs text-stone-400">{attendanceRate}% attendance rate</p>
            <p className="text-xs text-stone-400">{attendance.total} total sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
