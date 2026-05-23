import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X, Upload, Check, ChevronLeft, ChevronRight, LogOut, LayoutGrid, User } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/babysitter/profile-setup")({
  head: () => ({ meta: [{ title: "Profile Setup — Kiddobee" }] }),
  component: BabysitterProfileSetup,
});

const STEPS = ["Basic info", "Experience", "Languages", "Availability", "References", "Documents", "Summary"];

const AGE_RANGES = ["0-3 ans", "3-6 ans", "6-12 ans", "12 ans et +"];

const MISSIONS = [
  "School pickup", "Homework help", "Cooking", "Bathing",
  "Bedtime routine", "Arts and crafts", "Outdoor activities", "Light housekeeping",
  "Overnight care", "Newborn care", "Multiple children", "Special needs care",
];

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const LANG_LEVELS = ["Native", "Fluent", "C2", "C1", "B2", "B1", "A2", "Conversational"];

const LANGUAGES = [
  "French", "English", "Spanish", "German", "Italian", "Arabic", "Portuguese",
  "Mandarin", "Russian", "Japanese", "Korean", "Dutch", "Swedish", "Polish", "Turkish",
  "Hindi", "Bengali", "Swahili", "Romanian", "Greek",
];

const DOCUMENT_TYPES = [
  { key: "profile_photo", label: "Profile photo" },
  { key: "id_card", label: "ID card" },
  { key: "cv", label: "CV" },
  { key: "criminal_record", label: "Criminal record (bulletin n°3)" },
  { key: "certificates", label: "Certificates / diplomas" },
];

type LangEntry = { name: string; level: string; accent: string };
type RefEntry = { name: string; description: string; phone: string; email: string };
type DocEntry = { url: string; filename: string };

function toInputDate(v: string): string {
  if (!v || v === "—") return "";
  const parts = v.split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return v;
}

function fromInputDate(v: string): string {
  if (!v) return "";
  const parts = v.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return v;
}

function BabysitterProfileSetup() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const DAYS = lang === "en" ? DAYS_EN : DAYS_FR;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [sitterId, setSitterId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [navFirstName, setNavFirstName] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Step 1 — Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Step 2 — Experience
  const [yearsExp, setYearsExp] = useState("");
  const [ageRanges, setAgeRanges] = useState<string[]>([]);
  const [missions, setMissions] = useState<string[]>([]);
  const [diplomas, setDiplomas] = useState("");

  // Step 3 — Languages
  const [languages, setLanguages] = useState<LangEntry[]>([{ name: "", level: "Native", accent: "" }]);

  // Step 4 — Availability
  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [availDays, setAvailDays] = useState<string[]>([]);

  // Step 5 — References
  const [references, setReferences] = useState<RefEntry[]>([]);

  // Step 6 — Documents
  const [documents, setDocuments] = useState<Record<string, DocEntry>>({});

  // Load existing data on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDataLoading(false); return; }
      setNavFirstName(user.user_metadata?.firstName ?? "");
      const sid = user.user_metadata?.profileId as string | undefined;
      setSitterId(sid ?? null);
      if (!sid) { setDataLoading(false); return; }

      const { data: s } = await supabase.from("Babysitter").select("*").eq("Sitter ID", sid).single();
      if (!s) { setDataLoading(false); return; }

      // Step 1
      setFirstName(s["First Name"] ?? "");
      setLastName(s["Last Name"] ?? "");
      setDob(toInputDate(s["Date of Birth"] ?? ""));
      setPhone(s["Phone Number"] && s["Phone Number"] !== "—" ? s["Phone Number"] : "");
      setCity(s["Location"] ?? "");

      // Step 2
      setYearsExp(s["Years of Experience"] != null ? String(s["Years of Experience"]) : "");
      setAgeRanges(s["Comfortable Age Ranges"] ? s["Comfortable Age Ranges"].split(", ").filter(Boolean) : []);
      setMissions(s["Proposed Missions"] ? s["Proposed Missions"].split(", ").filter(Boolean) : []);
      setDiplomas(s["diplomas"] ?? "");

      // Step 3 — prefer language_levels JSON, fall back to Language 1-5
      if (s["language_levels"]) {
        try {
          const parsed = JSON.parse(s["language_levels"]) as LangEntry[];
          if (parsed.length > 0) { setLanguages(parsed); }
        } catch {
          loadLangFallback(s);
        }
      } else {
        loadLangFallback(s);
      }

      // Step 4
      setAvailStart(toInputDate(s["Availability Start Date"] ?? ""));
      const endVal = s["Availability End Date"];
      setAvailEnd(endVal && endVal !== "Open" ? toInputDate(endVal) : "");
      if (s["availability_days"]) setAvailDays(s["availability_days"].split(",").filter(Boolean));

      // Step 5
      if (s["references_data"]) {
        try { setReferences(JSON.parse(s["references_data"])); } catch {}
      }

      // Step 6
      if (s["documents_data"]) {
        try { setDocuments(JSON.parse(s["documents_data"])); } catch {}
      }

      setDataLoading(false);
    }

    function loadLangFallback(s: any) {
      const langs = [1, 2, 3, 4, 5]
        .map(n => s[`Language ${n}`])
        .filter(Boolean)
        .map((name: string) => ({ name, level: "Native", accent: "" }));
      if (langs.length > 0) setLanguages(langs);
    }

    load().catch(() => setDataLoading(false));
  }, []);

  // Per-step save helpers
  async function saveStep1() {
    if (!sitterId) return;
    setSaving(true);
    const { error } = await supabase.from("Babysitter").update({
      "First Name": firstName,
      "Last Name": lastName,
      "Date of Birth": fromInputDate(dob),
      "Phone Number": phone || "—",
      "Location": city,
    }).eq("Sitter ID", sitterId);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Saved");
  }

  async function saveStep2() {
    if (!sitterId) return;
    setSaving(true);
    await supabase.from("Babysitter").update({
      "Years of Experience": Number(yearsExp) || 0,
      "Comfortable Age Ranges": ageRanges.join(", "),
      "Proposed Missions": missions.join(", "),
    }).eq("Sitter ID", sitterId);
    // diplomas may not have its own column — try separately
    await supabase.from("Babysitter").update({ "diplomas": diplomas }).eq("Sitter ID", sitterId);
    setSaving(false);
    toast.success("Saved");
  }

  async function saveStep3() {
    if (!sitterId) return;
    setSaving(true);
    const validLangs = languages.filter(l => l.name);
    const langMap: Record<string, string | null> = {};
    for (let i = 1; i <= 5; i++) {
      langMap[`Language ${i}`] = validLangs[i - 1]?.name ?? null;
    }
    langMap["Languages Spoken"] = validLangs.map(l => l.name).join(", ");
    await supabase.from("Babysitter").update(langMap).eq("Sitter ID", sitterId);
    // language_levels stores full data (levels + accents)
    await supabase.from("Babysitter").update({ "language_levels": JSON.stringify(validLangs) }).eq("Sitter ID", sitterId);
    setSaving(false);
    toast.success("Saved");
  }

  async function saveStep4() {
    if (!sitterId) return;
    setSaving(true);
    await supabase.from("Babysitter").update({
      "Availability Start Date": fromInputDate(availStart),
      "Availability End Date": availEnd ? fromInputDate(availEnd) : "Open",
    }).eq("Sitter ID", sitterId);
    await supabase.from("Babysitter").update({ "availability_days": availDays.join(",") }).eq("Sitter ID", sitterId);
    setSaving(false);
    toast.success("Saved");
  }

  async function saveStep5() {
    if (!sitterId) return;
    setSaving(true);
    await supabase.from("Babysitter").update({ "references_data": JSON.stringify(references) }).eq("Sitter ID", sitterId);
    setSaving(false);
    toast.success("Saved");
  }

  async function saveStep6() {
    if (!sitterId) return;
    setSaving(true);
    await supabase.from("Babysitter").update({ "documents_data": JSON.stringify(documents) }).eq("Sitter ID", sitterId);
    setSaving(false);
    toast.success("Saved");
  }

  async function submitProfile() {
    if (!sitterId) return;
    setSaving(true);
    const { error } = await supabase.from("Babysitter").update({ "Profile Status": "Submitted" }).eq("Sitter ID", sitterId);
    setSaving(false);
    if (error) { toast.error("Submit failed"); return; }
    toast.success("Profile submitted!");
    navigate({ to: "/babysitter/dashboard" });
  }

  async function handleUpload(docKey: string, file: File) {
    if (!sitterId) return;
    setUploading(docKey);
    const ext = file.name.split(".").pop();
    const path = `${sitterId}/${docKey}.${ext}`;
    const { error } = await supabase.storage.from("babysitter-documents").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("babysitter-documents").getPublicUrl(path);
    setDocuments(prev => ({ ...prev, [docKey]: { url: urlData.publicUrl, filename: file.name } }));
    setUploading(null);
    toast.success("Uploaded");
  }

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  const saveHandlers: Record<number, () => Promise<void>> = {
    1: saveStep1, 2: saveStep2, 3: saveStep3,
    4: saveStep4, 5: saveStep5, 6: saveStep6,
  };

  const displayFirstName = navFirstName || firstName;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <header className="bg-white border-b w-full sticky top-0 z-10">
          <div className="px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <img src="/logo.avif" alt="Kiddobee" className="h-8 w-auto object-contain" />
              <span className="bg-[#00B4D8] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Babysitter</span>
            </div>
            <nav className="flex items-center gap-1">
              <Link to="/babysitter/dashboard">
                {({ isActive }) => (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    <LayoutGrid className="h-4 w-4" />
                    Dashboard
                  </span>
                )}
              </Link>
              <Link to="/babysitter/profile-setup">
                {({ isActive }) => (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    <User className="h-4 w-4" />
                    Profile
                  </span>
                )}
              </Link>
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              <LanguageToggle />
              <button
                onClick={() => signOut().then(() => navigate({ to: "/login" }))}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#00B4D8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Navbar */}
      <header className="bg-white border-b w-full sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.avif" alt="Kiddobee" className="h-8 w-auto object-contain" />
            <span className="bg-[#00B4D8] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Babysitter</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/babysitter/dashboard">
              {({ isActive }) => (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <LayoutGrid className="h-4 w-4" />
                  Dashboard
                </span>
              )}
            </Link>
            <Link to="/babysitter/profile-setup">
              {({ isActive }) => (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <User className="h-4 w-4" />
                  Profile
                </span>
              )}
            </Link>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <button
              onClick={() => signOut().then(() => navigate({ to: "/login" }))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-xl font-bold text-gray-900 mb-6">Your profile</h1>

        {/* Tab navigation */}
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto mb-6">
          {STEPS.map((label, idx) => {
            const n = idx + 1;
            const active = step === n;
            return (
              <button
                key={n}
                onClick={() => setStep(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors shrink-0 whitespace-nowrap ${
                  active
                    ? "bg-[#00B4D8] border-[#00B4D8] text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[#00B4D8]/50"
                }`}
              >
                {n}. {label}
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          {/* STEP 1 — Basic info */}
          {step === 1 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Basic info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Marie" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date of birth</Label>
                  <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 …" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Paris 11e" />
              </div>
              <Button onClick={saveStep1} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 2 — Experience */}
          {step === 2 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Experience</h2>
              <div className="space-y-1.5">
                <Label>Years of experience</Label>
                <Input type="number" min={0} max={30} value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="e.g. 3" />
              </div>
              <div className="space-y-2">
                <Label>Comfortable age ranges</Label>
                <div className="space-y-2">
                  {AGE_RANGES.map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-gray-100 hover:border-[#00B4D8]/30">
                      <Checkbox
                        checked={ageRanges.includes(r)}
                        onCheckedChange={() => setAgeRanges(toggleArr(ageRanges, r))}
                        className="data-[state=checked]:bg-[#00B4D8] data-[state=checked]:border-[#00B4D8]"
                      />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Proposed missions</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MISSIONS.map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-100 hover:border-[#00B4D8]/30">
                      <Checkbox
                        checked={missions.includes(m)}
                        onCheckedChange={() => setMissions(toggleArr(missions, m))}
                        className="data-[state=checked]:bg-[#00B4D8] data-[state=checked]:border-[#00B4D8]"
                      />
                      <span className="text-xs">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Diplomas &amp; certifications</Label>
                <Textarea
                  value={diplomas}
                  onChange={e => setDiplomas(e.target.value)}
                  rows={3}
                  placeholder="e.g. CAP Petite Enfance, First Aid certificate…"
                />
              </div>
              <Button onClick={saveStep2} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 3 — Languages */}
          {step === 3 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Languages</h2>
              <div className="space-y-3">
                {languages.map((l, i) => (
                  <div key={i} className="flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <Label className="text-xs text-gray-500">Language</Label>
                      <Input
                        value={l.name}
                        onChange={e => setLanguages(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                        placeholder="e.g. English"
                        list={`lang-list-${i}`}
                      />
                      <datalist id={`lang-list-${i}`}>
                        {LANGUAGES.map(lang => <option key={lang} value={lang} />)}
                      </datalist>
                    </div>
                    <div className="w-36 space-y-1">
                      <Label className="text-xs text-gray-500">Level</Label>
                      <Select value={l.level} onValueChange={v => setLanguages(prev => prev.map((x, idx) => idx === i ? { ...x, level: v } : x))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{LANG_LEVELS.map(lv => <SelectItem key={lv} value={lv}>{lv}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {l.name.toLowerCase() === "english" && (
                      <div className="w-28 space-y-1">
                        <Label className="text-xs text-gray-500">Accent</Label>
                        <Input
                          value={l.accent}
                          onChange={e => setLanguages(prev => prev.map((x, idx) => idx === i ? { ...x, accent: e.target.value } : x))}
                          placeholder="e.g. British"
                        />
                      </div>
                    )}
                    {languages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLanguages(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors mb-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {languages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setLanguages(prev => [...prev, { name: "", level: "Fluent", accent: "" }])}
                    className="flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#0096B4] font-medium"
                  >
                    <Plus className="h-4 w-4" /> Add language
                  </button>
                )}
              </div>
              <Button onClick={saveStep3} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 4 — Availability */}
          {step === 4 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Availability</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input type="date" value={availStart} onChange={e => setAvailStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End date <span className="text-gray-400 font-normal">(leave blank = open)</span></Label>
                  <Input type="date" value={availEnd} onChange={e => setAvailEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Available days</Label>
                {DAYS_EN.map((key, idx) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-100 hover:border-[#00B4D8]/30">
                    <Checkbox
                      checked={availDays.includes(key)}
                      onCheckedChange={() => setAvailDays(toggleArr(availDays, key))}
                      className="data-[state=checked]:bg-[#00B4D8] data-[state=checked]:border-[#00B4D8]"
                    />
                    <span className="text-sm font-medium">{DAYS[idx]}</span>
                  </label>
                ))}
              </div>
              <Button onClick={saveStep4} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 5 — References */}
          {step === 5 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">References</h2>
              <p className="text-xs text-[#00B4D8] bg-[#00B4D8]/5 rounded-lg px-3 py-2">
                Please add a second reference if you can.
              </p>
              <div className="space-y-4">
                {references.map((ref, i) => (
                  <div key={i} className="border rounded-xl p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => setReferences(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference {i + 1}</p>
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input value={ref.name} onChange={e => setReferences(prev => prev.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))} placeholder="Full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input value={ref.description} onChange={e => setReferences(prev => prev.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r))} placeholder="How do you know them?" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input value={ref.phone} onChange={e => setReferences(prev => prev.map((r, idx) => idx === i ? { ...r, phone: e.target.value } : r))} placeholder="+33 6 …" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" value={ref.email} onChange={e => setReferences(prev => prev.map((r, idx) => idx === i ? { ...r, email: e.target.value } : r))} placeholder="email@example.com" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReferences(prev => [...prev, { name: "", description: "", phone: "", email: "" }])}
                  className="flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#0096B4] font-medium"
                >
                  <Plus className="h-4 w-4" /> Add reference
                </button>
              </div>
              <Button onClick={saveStep5} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 6 — Documents */}
          {step === 6 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Documents</h2>
              <div className="space-y-2">
                {DOCUMENT_TYPES.map(doc => {
                  const uploaded = documents[doc.key];
                  const isUploading = uploading === doc.key;
                  return (
                    <div key={doc.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {uploaded ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" /> {uploaded.filename}
                            </span>
                          ) : "Not uploaded"}
                        </p>
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={el => { fileRefs.current[doc.key] = el; }}
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(doc.key, file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => fileRefs.current[doc.key]?.click()}
                          className="border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/5 text-xs"
                        >
                          {isUploading ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading…</> : <><Upload className="h-3 w-3 mr-1" />{uploaded ? "Replace" : "Upload"}</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={saveStep6} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
              </Button>
            </>
          )}

          {/* STEP 7 — Summary */}
          {step === 7 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Summary</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["Name", `${firstName} ${lastName}`.trim() || "—"],
                  ["Phone", phone || "—"],
                  ["City", city || "—"],
                  ["Date of birth", dob || "—"],
                  ["Years of experience", yearsExp || "—"],
                  ["Age ranges", ageRanges.join(", ") || "—"],
                  ["Missions", missions.join(", ") || "—"],
                  ["Languages", languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(", ") || "—"],
                  ["Availability", availStart ? `From ${availStart}${availEnd ? ` to ${availEnd}` : " (open)"}` : "—"],
                  ["Available days", availDays.join(", ") || "—"],
                  ["References", references.length > 0 ? `${references.length} added` : "None"],
                  ["Documents", Object.keys(documents).length > 0 ? `${Object.keys(documents).length}/5 uploaded` : "None"],
                  ["Diplomas", diplomas || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="text-gray-800 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={submitProfile}
                disabled={saving}
                className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white mt-2"
              >
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit profile"}
              </Button>
            </>
          )}
        </div>

        {/* Back / Next navigation */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < 7 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-[#00B4D8] hover:bg-[#0096B4] text-white"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
