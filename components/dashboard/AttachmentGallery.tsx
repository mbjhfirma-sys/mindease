"use client";

import { FileText, File as FileIcon, Download } from "lucide-react";

export type Attachment = { id: string; name: string; size: number; mimeType: string; url: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentGallery({ attachments, label }: { attachments: Attachment[]; label?: string }) {
  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const videos = attachments.filter((a) => a.mimeType.startsWith("video/"));
  const audio = attachments.filter((a) => a.mimeType.startsWith("audio/"));
  const files = attachments.filter(
    (a) => !a.mimeType.startsWith("image/") && !a.mimeType.startsWith("video/") && !a.mimeType.startsWith("audio/")
  );

  return (
    <div className="space-y-2.5">
      {label && <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">{label}</p>}
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden border border-stone-100 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.name} className="w-full max-h-64 object-cover" />
            </a>
          ))}
        </div>
      )}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v) => (
            <video key={v.id} src={v.url} controls className="w-full max-h-72 rounded-2xl border border-stone-100 bg-black" />
          ))}
        </div>
      )}
      {audio.length > 0 && (
        <div className="space-y-2">
          {audio.map((a) => (
            <audio key={a.id} src={a.url} controls className="w-full" />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5 hover:border-stone-200 transition-colors">
                <div className="flex-shrink-0 text-stone-500">
                  {f.mimeType === "application/pdf" ? <FileText size={16} strokeWidth={1.5} /> : <FileIcon size={16} strokeWidth={1.5} />}
                </div>
                <span className="flex-1 text-xs text-stone-700 font-medium truncate">{f.name}</span>
                <span className="text-[10px] text-stone-400 flex-shrink-0">{formatBytes(f.size)}</span>
                <Download size={12} strokeWidth={1.5} className="text-stone-300 flex-shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
