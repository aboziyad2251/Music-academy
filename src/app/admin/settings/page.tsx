"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Settings, Shield, MessageSquare, UserPlus, Wrench, Mail, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platform_name: "Music Online Academy",
    enable_ai_chat: true,
    enable_registrations: true,
    maintenance_mode: false,
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(({ settings: s }) => {
        if (s) setSettings({
          platform_name: s.platform_name ?? "Music Online Academy",
          enable_ai_chat: s.enable_ai_chat ?? true,
          enable_registrations: s.enable_registrations ?? true,
          maintenance_mode: s.maintenance_mode ?? false,
        });
      })
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggles = [
    { key: "enable_ai_chat" as const, label: "AI Chat Assistant", desc: "Allow students to use AI-powered chat for lesson help.", icon: MessageSquare, color: "text-indigo-400" },
    { key: "enable_registrations" as const, label: "New Registrations", desc: "Allow new users to register on the platform.", icon: UserPlus, color: "text-emerald-400" },
    { key: "maintenance_mode" as const, label: "Maintenance Mode", desc: "Display a maintenance page to all non-admin users.", icon: Wrench, color: "text-amber-400" },
  ];

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="h-7 w-7 text-amber-400" /> Platform Settings
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Configure global platform behavior and feature flags.</p>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">General</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Platform Name</label>
          <Input value={settings.platform_name}
            onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500" />
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Feature Flags</h2>
        <div className="space-y-2">
          {toggles.map(({ key, label, desc, icon: Icon, color }) => (
            <label key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-200 text-sm">{label}</p>
                  <p className="text-xs text-slate-500 truncate">{desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings[key] ? "bg-amber-600" : "bg-slate-700"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${settings[key] ? "translate-x-5" : "translate-x-0"}`} />
                  <input type="checkbox" className="sr-only" checked={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Admin Account</h2>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-800/30">
          <div className="h-10 w-10 rounded-lg bg-amber-900/50 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Primary Admin</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-400">tarj123@gmail.com</span>
            </div>
          </div>
          <Badge className="bg-amber-900/60 text-amber-400 border border-amber-800/40">admin</Badge>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 text-sm font-semibold">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
