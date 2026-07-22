"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AdminUserItem } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Users</h1>
        <p className="text-sm text-stone-500 mt-1">{users.length} client{users.length !== 1 ? "s" : ""} on the platform</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
      />

      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-50 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 px-5 py-4" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">
            {users.length === 0 ? "No users yet." : "No users match your search."}
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((u) => {
              const isActive = u.lastActivity === "recent";
              return (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group">
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-stone-900 group-hover:text-stone-700">{u.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${isActive ? "border-sage-200 text-sage-600" : "border-stone-200 text-stone-400"}`}>
                        {isActive ? "active" : "inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 truncate">{u.email} · {u.plan} · Level {u.level}</div>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block min-w-[120px]">
                    <div className="text-xs text-stone-500">Therapist</div>
                    <div className="text-xs font-medium text-stone-700 truncate">{u.therapistName ?? "Unassigned"}</div>
                  </div>

                  <div className="text-right flex-shrink-0 hidden md:block min-w-[72px]">
                    <div className="text-xs text-stone-500">Joined</div>
                    <div className="text-xs font-medium text-stone-700">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
