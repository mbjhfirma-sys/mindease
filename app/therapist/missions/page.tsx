"use client";

import { useState } from "react";
import { therapistMissions, therapistClients, type BuiltMission } from "@/lib/mockData";
import { useRef } from "react";
import { Plus, Pencil, Trash2, Eye, X, Check, ChevronRight, Clock, Repeat2, CalendarDays, Users, Paperclip, FileText, ImageIcon, File, Upload } from "lucide-react";

type AttachedFile = { id: string; name: string; size: number; mimeType: string; url: string };

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon size={14} strokeWidth={1.5} className="text-stone-500" />;
  if (mimeType === "application/pdf") return <FileText size={14} strokeWidth={1.5} className="text-stone-500" />;
  return <File size={14} strokeWidth={1.5} className="text-stone-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Mode = "list" | "create" | "edit" | "view";

const CATEGORIES = ["mindfulness", "journaling", "breathing", "movement", "exposure", "social", "habit", "safety"];
const DURATIONS = ["5 min", "10 min", "15 min", "20 min", "30 min", "45 min", "60 min"];

const BLANK_FORM = {
  title: "",
  description: "",
  category: "mindfulness",
  duration: "10 min",
  assignedTo: [] as string[],
  dueDate: "",
  recurring: "none" as BuiltMission["recurring"],
};

function MissionForm({
  form,
  setForm,
  attachments,
  setAttachments,
  onCancel,
  onDraft,
  onSave,
  submitLabel,
  heading,
  saved,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
  attachments: AttachedFile[];
  setAttachments: (files: AttachedFile[]) => void;
  onCancel: () => void;
  onDraft: () => void;
  onSave: () => void;
  submitLabel: string;
  heading: string;
  saved: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next: AttachedFile[] = [...attachments];
    Array.from(fileList).forEach((f) => {
      if (!next.find((x) => x.name === f.name && x.size === f.size)) {
        next.push({ id: `f${Date.now()}-${Math.random()}`, name: f.name, size: f.size, mimeType: f.type, url: URL.createObjectURL(f) });
      }
    });
    setAttachments(next);
  }

  function removeFile(id: string) {
    setAttachments(attachments.filter((f) => f.id !== id));
  }

  function toggleClient(id: string) {
    setForm({
      ...form,
      assignedTo: form.assignedTo.includes(id)
        ? form.assignedTo.filter((x) => x !== id)
        : [...form.assignedTo, id],
    });
  }

  if (saved) {
    return (
      <div className="py-14 text-center">
        <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-stone-800">{heading === "Edit Task" ? "Changes saved" : "Task created"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Morning gratitude practice"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what the client should do and the therapeutic rationale…"
            rows={3}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 resize-none focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Duration</label>
          <select
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            {DURATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Recurrence</label>
          <select
            value={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.value as BuiltMission["recurring"] })}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
          >
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        {form.recurring === "none" && (
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        )}
      </div>

      {/* ── Attachments ── */}
      <div>
        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Attachments</label>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            dragging ? "border-stone-400 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
        >
          <Upload size={18} strokeWidth={1.5} className="text-stone-400" />
          <p className="text-xs text-stone-500 text-center">
            Drop files here or <span className="font-medium text-stone-700">browse</span>
          </p>
          <p className="text-[10px] text-stone-400">PDF, images, Word, Excel, PowerPoint · Max 20 MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Attached file list */}
        {attachments.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {attachments.map((f) => (
              <li key={f.id} className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <div className="flex-shrink-0">{fileIcon(f.mimeType)}</div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-xs text-stone-700 font-medium truncate hover:underline"
                >
                  {f.name}
                </a>
                <span className="text-[10px] text-stone-400 flex-shrink-0">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                  className="flex-shrink-0 text-stone-300 hover:text-red-400 transition-colors"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest block mb-2">Assign to clients</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {therapistClients.map((c) => {
            const selected = form.assignedTo.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleClient(c.id)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  selected ? "bg-stone-900 border-stone-900" : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${selected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                  {c.name[0]}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-medium leading-tight truncate ${selected ? "text-white" : "text-stone-800"}`}>{c.name.split(" ")[0]}</div>
                  <div className={`text-[10px] truncate ${selected ? "text-white/60" : "text-stone-400"}`}>{c.condition[0]}</div>
                </div>
                {selected && <Check size={12} className="ml-auto text-white flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-stone-100">
        <button type="button" onClick={onCancel} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">
          Cancel
        </button>
        <button type="button" onClick={onDraft} className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">
          Save draft
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!form.title.trim() || form.assignedTo.length === 0}
          className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function MissionBuilderPage() {
  const [missions, setMissions] = useState(therapistMissions);
  const [mode, setMode] = useState<Mode>("list");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof BLANK_FORM>(BLANK_FORM);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [missionAttachments, setMissionAttachments] = useState<Record<string, AttachedFile[]>>({});
  const [saved, setSaved] = useState(false);

  const filtered = missions.filter((m) => filter === "all" || m.status === filter);
  const editingMission = missions.find((m) => m.id === editingId) ?? null;
  const viewingMission = missions.find((m) => m.id === viewingId) ?? null;

  function openCreate() {
    setForm(BLANK_FORM);
    setAttachments([]);
    setSaved(false);
    setMode("create");
  }

  function openEdit(m: BuiltMission) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description,
      category: m.category,
      duration: m.duration,
      assignedTo: [...m.assignedTo],
      dueDate: m.dueDate ?? "",
      recurring: m.recurring,
    });
    setAttachments(missionAttachments[m.id] ?? []);
    setSaved(false);
    setMode("edit");
  }

  function openView(m: BuiltMission) {
    setViewingId(m.id);
    setMode("view");
  }

  function goList() {
    setMode("list");
    setEditingId(null);
    setViewingId(null);
    setAttachments([]);
    setSaved(false);
  }

  function commitCreate(asDraft: boolean) {
    if (!form.title.trim()) return;
    const id = `bm${Date.now()}`;
    const m: BuiltMission = {
      id,
      ...form,
      xp: 0,
      status: asDraft ? "draft" : "active",
      completionRate: 0,
      dueDate: form.dueDate || undefined,
    };
    setMissions([m, ...missions]);
    if (attachments.length > 0) setMissionAttachments((prev) => ({ ...prev, [id]: attachments }));
    setSaved(true);
    setTimeout(goList, 1200);
  }

  function commitEdit(asDraft: boolean) {
    if (!form.title.trim() || !editingId) return;
    setMissions((prev) =>
      prev.map((m) =>
        m.id === editingId
          ? { ...m, ...form, status: asDraft ? "draft" : m.status, dueDate: form.dueDate || undefined }
          : m
      )
    );
    setMissionAttachments((prev) => ({ ...prev, [editingId]: attachments }));
    setSaved(true);
    setTimeout(goList, 1200);
  }

  function confirmDelete() {
    if (!deleteId) return;
    setMissions((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== "list" && (
            <button onClick={goList} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">
              {mode === "create" ? "New Task" : mode === "edit" ? "Edit Task" : mode === "view" ? "Task Detail" : "Task Builder"}
            </h1>
            {mode === "list" && <p className="text-sm text-stone-500 mt-1">Create and assign therapeutic tasks to clients</p>}
          </div>
        </div>
        {mode === "list" && (
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
            <Plus size={15} strokeWidth={2} /> Create task
          </button>
        )}
        {mode === "view" && viewingMission && (
          <button
            onClick={() => openEdit(viewingMission)}
            className="flex items-center gap-1.5 border border-stone-200 text-stone-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Pencil size={13} strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {/* ── Create ── */}
      {mode === "create" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          <MissionForm
            form={form}
            setForm={setForm}
            attachments={attachments}
            setAttachments={setAttachments}
            heading="New Task"
            saved={saved}
            onCancel={goList}
            onDraft={() => commitCreate(true)}
            onSave={() => commitCreate(false)}
            submitLabel="Assign now"
          />
        </div>
      )}

      {/* ── Edit ── */}
      {mode === "edit" && (
        <div className="bg-white border border-stone-100 rounded-xl p-6">
          <MissionForm
            form={form}
            setForm={setForm}
            attachments={attachments}
            setAttachments={setAttachments}
            heading="Edit Task"
            saved={saved}
            onCancel={goList}
            onDraft={() => commitEdit(true)}
            onSave={() => commitEdit(false)}
            submitLabel="Save changes"
          />
        </div>
      )}

      {/* ── View detail ── */}
      {mode === "view" && viewingMission && (
        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-stone-900">{viewingMission.title}</h2>
              <span className={`text-[10px] border px-1.5 py-0.5 rounded capitalize ${
                viewingMission.status === "active" ? "border-stone-200 text-stone-600" :
                viewingMission.status === "draft" ? "border-stone-100 text-stone-400" :
                "border-stone-200 text-stone-400"
              }`}>{viewingMission.status}</span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed mt-1">{viewingMission.description || <span className="italic text-stone-300">No description</span>}</p>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-100">
            {[
              { Icon: Clock, label: "Duration", value: viewingMission.duration },
              { Icon: Repeat2, label: "Recurrence", value: viewingMission.recurring === "none" ? "One-time" : viewingMission.recurring },
              { Icon: CalendarDays, label: "Due date", value: viewingMission.dueDate ?? "—" },
              { Icon: Users, label: "Category", value: viewingMission.category },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                  <Icon size={12} strokeWidth={1.5} /> {label}
                </div>
                <div className="text-sm font-medium text-stone-800 capitalize">{value}</div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-b border-stone-100">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">Assigned clients</div>
            <div className="flex flex-wrap gap-2">
              {viewingMission.assignedTo.length === 0 && <span className="text-sm text-stone-400 italic">No clients assigned</span>}
              {viewingMission.assignedTo.map((cid) => {
                const c = therapistClients.find((x) => x.id === cid);
                if (!c) return null;
                return (
                  <div key={cid} className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-xs font-semibold text-stone-600">{c.name[0]}</div>
                    <div>
                      <div className="text-xs font-medium text-stone-800">{c.name}</div>
                      <div className="text-[10px] text-stone-400">{c.condition[0]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(missionAttachments[viewingMission.id]?.length ?? 0) > 0 && (
            <div className="px-6 py-4 border-t border-stone-100">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Paperclip size={11} strokeWidth={1.5} /> Attachments
              </div>
              <ul className="space-y-1.5">
                {missionAttachments[viewingMission.id].map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                    <div className="flex-shrink-0">{fileIcon(f.mimeType)}</div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-xs text-stone-700 font-medium truncate hover:underline"
                    >
                      {f.name}
                    </a>
                    <span className="text-[10px] text-stone-400 flex-shrink-0">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {viewingMission.status === "active" && (
            <div className="px-6 py-4 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span>Completion rate</span>
                <span className="font-semibold text-stone-900">{viewingMission.completionRate}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5">
                <div className="bg-stone-900 h-1.5 rounded-full" style={{ width: `${viewingMission.completionRate}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      {mode === "list" && (
        <>
          <div className="flex border-b border-stone-100">
            {(["all", "active", "draft", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  filter === f ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1.5 text-[10px] text-stone-400">
                    ({missions.filter((m) => m.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white border border-stone-100 rounded-xl py-14 text-center text-sm text-stone-400">
              No tasks in this category
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((mission) => (
              <div key={mission.id} className="bg-white border border-stone-100 rounded-xl hover:border-stone-200 transition-colors">
                {/* Main row */}
                <div className="flex items-start gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-stone-900">{mission.title}</h3>
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded capitalize ${
                        mission.status === "active" ? "border-stone-200 text-stone-600" :
                        mission.status === "draft" ? "border-stone-100 text-stone-400" :
                        "border-stone-200 text-stone-400"
                      }`}>{mission.status}</span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{mission.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-stone-400">
                      <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{mission.duration}</span>
                      <span className="flex items-center gap-1 capitalize">
                        <Repeat2 size={11} strokeWidth={1.5} />
                        {mission.recurring === "none" ? "One-time" : mission.recurring}
                      </span>
                      {mission.dueDate && (
                        <span className="flex items-center gap-1"><CalendarDays size={11} strokeWidth={1.5} />Due {mission.dueDate}</span>
                      )}
                      <span className="capitalize">{mission.category}</span>
                      {(missionAttachments[mission.id]?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip size={11} strokeWidth={1.5} />
                          {missionAttachments[mission.id].length} file{missionAttachments[mission.id].length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openView(mission)}
                      title="View details"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
                    >
                      <Eye size={15} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => openEdit(mission)}
                      title="Edit task"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all"
                    >
                      <Pencil size={15} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setDeleteId(mission.id)}
                      title="Delete task"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => openView(mission)}
                      className="ml-1 text-stone-300 hover:text-stone-500 transition-colors"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-stone-50 bg-stone-50/50 rounded-b-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Assigned to</span>
                    <div className="flex -space-x-1">
                      {mission.assignedTo.slice(0, 4).map((cid) => {
                        const c = therapistClients.find((x) => x.id === cid);
                        return c ? (
                          <div
                            key={cid}
                            title={c.name}
                            className="w-6 h-6 bg-stone-200 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-semibold text-stone-600"
                          >
                            {c.name[0]}
                          </div>
                        ) : null;
                      })}
                      {mission.assignedTo.length === 0 && (
                        <span className="text-xs text-stone-300 italic">nobody yet</span>
                      )}
                      {mission.assignedTo.length > 4 && (
                        <div className="w-6 h-6 bg-stone-100 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-stone-500">
                          +{mission.assignedTo.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  {mission.status === "active" && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-stone-200 rounded-full h-1">
                        <div className="bg-stone-900 h-1 rounded-full" style={{ width: `${mission.completionRate}%` }} />
                      </div>
                      <span className="text-xs text-stone-500">{mission.completionRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Delete this task?</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-5">
              <span className="font-medium text-stone-700">"{missions.find((m) => m.id === deleteId)?.title}"</span> will be removed from all assigned clients. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-stone-200 text-sm py-2.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
