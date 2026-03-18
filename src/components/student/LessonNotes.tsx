"use client";

import { useEffect, useRef, useState } from "react";
import { StickyNote, Save, Check } from "lucide-react";

interface Props {
  lessonId: string;
}

type SaveState = "idle" | "saving" | "saved";

export default function LessonNotes({ lessonId }: Props) {
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note on mount
  useEffect(() => {
    fetch(`/api/notes?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((d) => {
        setContent(d.content ?? "");
        setLastSaved(d.updated_at ?? null);
      });
  }, [lessonId]);

  const save = async (text: string) => {
    setSaveState("saving");
    await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, content: text }),
    });
    setLastSaved(new Date().toISOString());
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val), 1500);
  };

  const formattedSaved = lastSaved
    ? new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-2xl bg-amber-950/20 border border-amber-800/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-amber-800/30 bg-amber-950/30">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-300">My Notes</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {saveState === "saving" && (
            <span className="text-amber-600 flex items-center gap-1">
              <Save className="h-3 w-3 animate-pulse" /> Saving...
            </span>
          )}
          {saveState === "saved" && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          {saveState === "idle" && formattedSaved && (
            <span className="text-amber-700">Saved at {formattedSaved}</span>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Write your personal notes for this lesson... (auto-saved)"
        rows={5}
        className="w-full bg-transparent px-5 py-4 text-sm text-amber-100/80 placeholder-amber-800/60 outline-none resize-y min-h-[120px]"
      />
    </div>
  );
}
