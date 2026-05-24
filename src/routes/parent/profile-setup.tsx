import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { signOut, PARIS_METRO_STATIONS } from "@/lib/auth";
import { LanguageToggle } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronRight, ChevronLeft, LogOut, LayoutGrid, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/profile-setup")({
  head: () => ({ meta: [{ title: "Profile Setup — Kiddobee" }] }),
  component: ParentProfileSetup,
});

const STEPS = ["Basic info", "Children", "Care", "Preferences", "Personality", "Additional", "Summary"];

const MISSIONS = [
  "School Pickup", "Homework Help", "Bath Supervision", "Dinner Prep", "Snack Prep",
  "Public Transport", "Housekeeping", "Activities & Playtime", "Cooking",
  "Laundry & Ironing", "Travel with Family", "Activity Escort", "Supervising Outings",
];
const AGE_RANGES = ["0-6 months", "6-9 months", "9-12 months", "1-3 years", "3-6 years", "6+ years"];
const LANGUAGES = [
  "French", "English", "Spanish", "German", "Italian", "Arabic", "Portuguese",
  "Mandarin", "Russian", "Japanese", "Korean", "Dutch", "Swedish", "Polish", "Turkish",
];
const SCHEDULE_TYPES = [
  "Recurring afternoons", "Recurring evenings", "Occasional weekends",
  "Full-time", "Part-time", "Flexible",
];

function MultiCheck({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-100 hover:border-[#00B4D8]/30">
          <Checkbox checked={selected.includes(o)} onCheckedChange={() => toggle(o)} className="data-[state=checked]:bg-[#00B4D8] data-[state=checked]:border-[#00B4D8]" />
          <span className="text-sm">{o}</span>
        </label>
      ))}
    </div>
  );
}

function SliderField({ label, desc, value, onChange }: { label: string; desc: [string, string]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold text-[#00B4D8]">{value}</span>
      </div>
      <Slider min={1} max={5} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="[&>[role=slider]]:bg-[#00B4D8]" />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{desc[0]}</span><span>{desc[1]}</span>
      </div>
    </div>
  );
}

function StationCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (value) setQuery(value); }, [value]);
  const filtered = query.length > 0 ? PARIS_METRO_STATIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : [];
  return (
    <div className="relative">
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type a station name…"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-[#00B4D8]/10 hover:text-[#00B4D8]"
              onMouseDown={() => { onChange(s); setQuery(s); setOpen(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ParentProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  // Step 1 — Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [arrondissement, setArrondissement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — Children
  const [numChildren, setNumChildren] = useState(1);
  const [childrenAges, setChildrenAges] = useState("");
  const [childrenGenders, setChildrenGenders] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [medicalNeeds, setMedicalNeeds] = useState("");

  // Step 3 — Care requirements
  const [missions, setMissions] = useState<string[]>([]);
  const [daysRequired, setDaysRequired] = useState("");
  const [hoursRequired, setHoursRequired] = useState("");
  const [scheduleType, setScheduleType] = useState("");
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxWait, setMaxWait] = useState("");

  // Step 4 — Preferences
  const [langRequired, setLangRequired] = useState("");
  const [langStrict, setLangStrict] = useState(false);
  const [familyLang, setFamilyLang] = useState("");
  const [secondLang, setSecondLang] = useState("");
  const [ageRange, setAgeRange] = useState<string[]>([]);
  const [expRequired, setExpRequired] = useState(false);
  const [minExp, setMinExp] = useState("");

  // Step 5 — Personality
  const [pEnergy, setPEnergy] = useState(3);
  const [pStructure, setPStructure] = useState(3);
  const [pWarmth, setPWarmth] = useState(3);
  const [pCreativity, setPCreativity] = useState(3);
  const [pDiscipline, setPDiscipline] = useState(3);
  const [pOutdoor, setPOutdoor] = useState(3);

  // Step 6 — Additional
  const [music, setMusic] = useState(false);
  const [art, setArt] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [sports, setSports] = useState(false);
  const [longTerm, setLongTerm] = useState(false);
  const [driving, setDriving] = useState(false);
  const [gardePartagee, setGardePartagee] = useState(false);
  const [notes, setNotes] = useState("");
  const [prevSitter, setPrevSitter] = useState("");

  // Load existing data on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDataLoading(false); return; }
      const pid = user.user_metadata?.profileId as string | undefined;
      setParentId(pid ?? null);
      if (!pid) { setDataLoading(false); return; }

      const { data: p } = await supabase.from("Parent").select("*").eq("Parent ID", pid).single();
      if (!p) { setDataLoading(false); return; }

      setFirstName(p["First Name"] ?? "");
      setLastName(p["Last Name"] ?? "");
      setLocation(p["Location (Arrondissement / City)"] ?? "");
      setArrondissement(p["Location (Arrondissement / City)"] ?? "");
      setPostalCode(p["Arrondissement / Postal Code"] ?? "");
      setPhone(p["Phone Number"] ?? "");
      setNumChildren(p["Number of Children"] ?? 1);
      setChildrenAges(p["Children's Ages"] ?? "");
      setChildrenGenders(p["Children's Genders"] ?? "");
      setSchoolLocation(p["Children's School Location"] ?? "");
      setMedicalNeeds(p["Any Medical / Special Needs"] ?? "");
      setMissions(p["Missions Required"] ? p["Missions Required"].split(", ").filter(Boolean) : []);
      setDaysRequired(p["Days Required"] ?? "");
      setHoursRequired(p["Hours Required"] ?? "");
      setScheduleType(p["Schedule Type"] ?? "");
      setMaxDistance(p["Max Distance from Parent (km)"] ?? 10);
      setMaxWait(p["Maximum waiting time"] ?? "");
      setLangRequired(p["Language Required"] ?? "");
      setLangStrict(p["Language Strict (Yes / No)"] === "Yes");
      setFamilyLang(p["Family Language(s) at Home"] ?? "");
      setSecondLang(p["Second Language"] ?? "");
      setAgeRange(p["Age Range of Children (for matching)"] ? p["Age Range of Children (for matching)"].split(", ").filter(Boolean) : []);
      setExpRequired(p["Experience Required (Yes / No)"] === "Yes");
      setMinExp(p["Minimum Years of Experience"] ? String(p["Minimum Years of Experience"]) : "");
      setPEnergy(p["Preferred Personality — Energy (1-5)"] ?? 3);
      setPStructure(p["Preferred Personality — Structure (1-5)"] ?? 3);
      setPWarmth(p["Preferred Personality — Warmth (1-5)"] ?? 3);
      setPCreativity(p["Preferred Personality — Creativity (1-5)"] ?? 3);
      setPDiscipline(p["Preferred Personality — Discipline (1-5)"] ?? 3);
      setPOutdoor(p["Preferred Personality — Outdoor Focus (1-5)"] ?? 3);
      setMusic(p["Musician / Music (Yes / No)"] === "Yes");
      setArt(p["Art and Craft (Yes / No)"] === "Yes");
      setDancing(p["Dancing (Yes / No)"] === "Yes");
      setSports(p["Sports (Yes / No)"] === "Yes");
      setLongTerm(p["Long-term / Full School Year (Yes / No)"] === "Yes");
      setDriving(p["Driving License Required (Yes / No)"] === "Yes");
      setGardePartagee(p["Garde Partagée / Shared Care (Yes / No)"] === "Yes");
      setNotes(p["Additional Notes / Special Requirements"] ?? "");
      setPrevSitter(p["Previous Sitter Name (if Trust Override)"] ?? "");

      setDataLoading(false);
    }
    load().catch(() => setDataLoading(false));
  }, []);

  async function save(patch: Record<string, unknown>) {
    if (!parentId) return;
    setSaving(true);
    const { error } = await supabase.from("Parent").update(patch).eq("Parent ID", parentId);
    setSaving(false);
    if (error) { toast.error("Save failed: " + error.message); return; }
    toast.success("Saved");
  }

  async function saveStep1() {
    await save({
      "First Name": firstName,
      "Last Name": lastName,
      "Location (Arrondissement / City)": location,
      "Arrondissement / Postal Code": postalCode,
      "Phone Number": phone,
    });
  }

  async function saveStep2() {
    await save({
      "Number of Children": numChildren,
      "Children's Ages": childrenAges,
      "Children's Genders": childrenGenders,
      "Children's School Location": schoolLocation,
      "Any Medical / Special Needs": medicalNeeds,
    });
  }

  async function saveStep3() {
    await save({
      "Missions Required": missions.join(", "),
      "Days Required": daysRequired,
      "Hours Required": hoursRequired,
      "Schedule Type": scheduleType,
      "Max Distance from Parent (km)": maxDistance,
      "Maximum waiting time": maxWait,
    });
  }

  async function saveStep4() {
    await save({
      "Language Required": langRequired,
      "Language Strict (Yes / No)": langStrict ? "Yes" : "No",
      "Family Language(s) at Home": familyLang,
      "Second Language": secondLang,
      "Age Range of Children (for matching)": ageRange.join(", "),
      "Experience Required (Yes / No)": expRequired ? "Yes" : "No",
      "Minimum Years of Experience": minExp,
    });
  }

  async function saveStep5() {
    await save({
      "Preferred Personality — Energy (1-5)": pEnergy,
      "Preferred Personality — Structure (1-5)": pStructure,
      "Preferred Personality — Warmth (1-5)": pWarmth,
      "Preferred Personality — Creativity (1-5)": pCreativity,
      "Preferred Personality — Discipline (1-5)": pDiscipline,
      "Preferred Personality — Outdoor Focus (1-5)": pOutdoor,
    });
  }

  async function saveStep6() {
    await save({
      "Musician / Music (Yes / No)": music ? "Yes" : "No",
      "Art and Craft (Yes / No)": art ? "Yes" : "No",
      "Dancing (Yes / No)": dancing ? "Yes" : "No",
      "Sports (Yes / No)": sports ? "Yes" : "No",
      "Long-term / Full School Year (Yes / No)": longTerm ? "Yes" : "No",
      "Driving License Required (Yes / No)": driving ? "Yes" : "No",
      "Garde Partagée / Shared Care (Yes / No)": gardePartagee ? "Yes" : "No",
      "Additional Notes / Special Requirements": notes,
      "Previous Sitter Name (if Trust Override)": prevSitter,
    });
  }

  async function submitProfile() {
    if (!parentId) return;
    setSaving(true);
    const { error } = await supabase.from("Parent").update({ "Profile Status": "Active" }).eq("Parent ID", parentId);
    setSaving(false);
    if (error) { toast.error("Submit failed: " + error.message); return; }
    toast.success("Profile complete!");
    navigate({ to: "/parent/matches" });
  }

  const saveHandlers: Record<number, () => Promise<void>> = {
    1: saveStep1, 2: saveStep2, 3: saveStep3,
    4: saveStep4, 5: saveStep5, 6: saveStep6,
  };

  const Navbar = (
    <header className="bg-white border-b w-full sticky top-0 z-10">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <img src="/logo.avif" alt="Kiddobee" className="h-8 w-auto object-contain" />
          <span className="bg-[#00B4D8] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Parent</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/parent/matches">
            {({ isActive }) => (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </span>
            )}
          </Link>
          <Link to="/parent/profile-setup">
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
  );

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        {Navbar}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-[#00B4D8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {Navbar}

      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
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
                <h2 className="text-base font-semibold text-gray-900">Basic information</h2>
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
                <div className="space-y-1.5">
                  <Label>Nearest Metro / RER station</Label>
                  <StationCombobox value={location} onChange={setLocation} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Arrondissement / City</Label>
                    <Input value={arrondissement} onChange={e => setArrondissement(e.target.value)} placeholder="e.g. Paris 11e" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postal code</Label>
                    <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="75011" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" type="tel" />
                </div>
                <Button onClick={saveStep1} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
                </Button>
              </>
            )}

            {/* STEP 2 — Children */}
            {step === 2 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">Children</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Number of children</Label>
                    <Input type="number" min={1} max={10} value={numChildren} onChange={e => setNumChildren(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Children's ages</Label>
                    <Input value={childrenAges} onChange={e => setChildrenAges(e.target.value)} placeholder="e.g. 4 years, 7 years" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Children's genders</Label>
                    <Input value={childrenGenders} onChange={e => setChildrenGenders(e.target.value)} placeholder="e.g. Girl, Boy" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>School location</Label>
                    <Input value={schoolLocation} onChange={e => setSchoolLocation(e.target.value)} placeholder="e.g. École du Marais, 75004" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Medical / special needs</Label>
                  <Textarea value={medicalNeeds} onChange={e => setMedicalNeeds(e.target.value)} placeholder="Any allergies, medical conditions…" rows={3} />
                </div>
                <Button onClick={saveStep2} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
                </Button>
              </>
            )}

            {/* STEP 3 — Care requirements */}
            {step === 3 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">Care requirements</h2>
                <div className="space-y-2">
                  <Label>Missions required</Label>
                  <MultiCheck options={MISSIONS} selected={missions} onChange={setMissions} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Days required</Label>
                    <Input value={daysRequired} onChange={e => setDaysRequired(e.target.value)} placeholder="Mon, Wed, Fri" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hours required</Label>
                    <Input value={hoursRequired} onChange={e => setHoursRequired(e.target.value)} placeholder="e.g. 16h–19h" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Schedule type</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Max distance from home</Label>
                    <span className="text-sm font-semibold text-[#00B4D8]">{maxDistance} km</span>
                  </div>
                  <Slider min={0} max={30} step={1} value={[maxDistance]} onValueChange={([v]) => setMaxDistance(v)} className="[&>[role=slider]]:bg-[#00B4D8]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Maximum waiting time (days)</Label>
                  <Input value={maxWait} onChange={e => setMaxWait(e.target.value)} placeholder="e.g. 14 days" />
                </div>
                <Button onClick={saveStep3} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
                </Button>
              </>
            )}

            {/* STEP 4 — Preferences */}
            {step === 4 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">Babysitter preferences</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Language required</Label>
                    <Select value={langRequired} onValueChange={setLangRequired}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Family language at home</Label>
                    <Select value={familyLang} onValueChange={setFamilyLang}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Language strict requirement</p>
                    <p className="text-xs text-gray-400">Sitter must speak required language</p>
                  </div>
                  <Switch checked={langStrict} onCheckedChange={setLangStrict} className="data-[state=checked]:bg-[#00B4D8]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Second language (optional)</Label>
                  <Select value={secondLang} onValueChange={setSecondLang}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Children's age range for matching</Label>
                  <MultiCheck options={AGE_RANGES} selected={ageRange} onChange={setAgeRange} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium">Experience required</p>
                  <Switch checked={expRequired} onCheckedChange={setExpRequired} className="data-[state=checked]:bg-[#00B4D8]" />
                </div>
                {expRequired && (
                  <div className="space-y-1.5">
                    <Label>Minimum years of experience</Label>
                    <Input type="number" min={0} max={20} value={minExp} onChange={e => setMinExp(e.target.value)} />
                  </div>
                )}
                <Button onClick={saveStep4} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
                </Button>
              </>
            )}

            {/* STEP 5 — Personality */}
            {step === 5 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">Personality preferences</h2>
                <p className="text-sm text-gray-500">Set your ideal babysitter's personality profile (1–5)</p>
                <SliderField label="Energy" desc={["Calm", "Energetic"]} value={pEnergy} onChange={setPEnergy} />
                <SliderField label="Structure" desc={["Flexible", "Structured"]} value={pStructure} onChange={setPStructure} />
                <SliderField label="Warmth" desc={["Professional", "Very warm"]} value={pWarmth} onChange={setPWarmth} />
                <SliderField label="Creativity" desc={["Practical", "Very creative"]} value={pCreativity} onChange={setPCreativity} />
                <SliderField label="Discipline" desc={["Gentle", "Firm"]} value={pDiscipline} onChange={setPDiscipline} />
                <SliderField label="Outdoor Focus" desc={["Indoor", "Outdoor"]} value={pOutdoor} onChange={setPOutdoor} />
                <Button onClick={saveStep5} disabled={saving} className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save"}
                </Button>
              </>
            )}

            {/* STEP 6 — Additional */}
            {step === 6 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">Additional information</h2>
                {([
                  ["Musician / Music", music, setMusic] as const,
                  ["Art and Craft", art, setArt] as const,
                  ["Dancing", dancing, setDancing] as const,
                  ["Sports", sports, setSports] as const,
                  ["Long-term / Full school year", longTerm, setLongTerm] as const,
                  ["Driving license required", driving, setDriving] as const,
                  ["Garde partagée / Shared care", gardePartagee, setGardePartagee] as const,
                ]).map(([label, val, setter]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="text-sm font-medium">{label}</p>
                    <Switch checked={val} onCheckedChange={setter} className="data-[state=checked]:bg-[#00B4D8]" />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Additional notes / special requirements</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any specific requirements…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Previous sitter name (if trust override)</Label>
                  <Input value={prevSitter} onChange={e => setPrevSitter(e.target.value)} placeholder="Name of previous sitter" />
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
                  {([
                    ["First name", firstName || "—"],
                    ["Last name", lastName || "—"],
                    ["Location", location || "—"],
                    ["Postal code", postalCode || "—"],
                    ["Phone", phone || "—"],
                    ["Number of children", String(numChildren)],
                    ["Children's ages", childrenAges || "—"],
                    ["Children's genders", childrenGenders || "—"],
                    ["School location", schoolLocation || "—"],
                    ["Medical / special needs", medicalNeeds || "—"],
                    ["Missions", missions.join(", ") || "—"],
                    ["Days required", daysRequired || "—"],
                    ["Hours required", hoursRequired || "—"],
                    ["Schedule type", scheduleType || "—"],
                    ["Max distance", `${maxDistance} km`],
                    ["Max waiting time", maxWait || "—"],
                    ["Language required", langRequired || "—"],
                    ["Language strict", langStrict ? "Yes" : "No"],
                    ["Family language", familyLang || "—"],
                    ["Second language", secondLang || "—"],
                    ["Age range for matching", ageRange.join(", ") || "—"],
                    ["Experience required", expRequired ? `Yes (min. ${minExp || "0"} yrs)` : "No"],
                    ["Personality — Energy", String(pEnergy)],
                    ["Personality — Structure", String(pStructure)],
                    ["Personality — Warmth", String(pWarmth)],
                    ["Personality — Creativity", String(pCreativity)],
                    ["Personality — Discipline", String(pDiscipline)],
                    ["Personality — Outdoor", String(pOutdoor)],
                    ["Music", music ? "Yes" : "No"],
                    ["Art & Craft", art ? "Yes" : "No"],
                    ["Dancing", dancing ? "Yes" : "No"],
                    ["Sports", sports ? "Yes" : "No"],
                    ["Long-term", longTerm ? "Yes" : "No"],
                    ["Driving required", driving ? "Yes" : "No"],
                    ["Garde partagée", gardePartagee ? "Yes" : "No"],
                    ["Notes", notes || "—"],
                    ["Previous sitter", prevSitter || "—"],
                  ] as [string, string][]).map(([label, value]) => (
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
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Complete profile"}
                </Button>
              </>
            )}
          </div>

          {/* Back / Next */}
          <div className="flex gap-3 mt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < STEPS.length && step !== 7 && (
              <Button
                onClick={async () => { if (saveHandlers[step]) await saveHandlers[step](); setStep(s => s + 1); }}
                disabled={saving}
                className="flex-1 bg-[#00B4D8] hover:bg-[#0096B4] text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
