import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PARIS_METRO_STATIONS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/babysitter/profile-setup")({
  head: () => ({ meta: [{ title: "Profile Setup — Kiddobee" }] }),
  component: BabysitterProfileSetup,
});

const MISSIONS = ["School Pickup","Homework Help","Bath Supervision","Dinner Prep","Snack Prep","Public Transport","Housekeeping","Activities & Playtime","Cooking","Laundry & Ironing","Travel with Family","Activity Escort","Supervising Outings"];
const AGE_RANGES = ["0-6 months","6-9 months","9-12 months","1-3 years","3-6 years","6+ years"];
const LANG_LEVELS = ["Native","Fluent","C2","B2","Conversational"];
const LANGUAGES = ["French","English","Spanish","German","Italian","Arabic","Portuguese","Mandarin","Russian","Japanese","Korean","Dutch","Swedish","Polish","Turkish"];
const TOTAL_STEPS = 6;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#00B4D8]">Step {step} of {TOTAL_STEPS}</span>
        <span className="text-sm text-gray-400">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#00B4D8] rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
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
      <div className="flex justify-between text-xs text-gray-400"><span>{desc[0]}</span><span>{desc[1]}</span></div>
    </div>
  );
}

function MultiCheck({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
          <Checkbox checked={selected.includes(o)} onCheckedChange={() => toggle(o)} className="data-[state=checked]:bg-[#00B4D8] data-[state=checked]:border-[#00B4D8]" />
          <span className="text-sm">{o}</span>
        </label>
      ))}
    </div>
  );
}

function StationCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = query.length > 0 ? PARIS_METRO_STATIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : [];
  return (
    <div className="relative">
      <Input value={value || query} onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Type a station name…" />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => <button key={s} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-[#00B4D8]/10 hover:text-[#00B4D8]" onMouseDown={() => { onChange(s); setQuery(s); setOpen(false); }}>{s}</button>)}
        </div>
      )}
    </div>
  );
}

function BabysitterProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [location, setLocation] = useState("");
  const [maxDist, setMaxDist] = useState(10);
  const [availStart, setAvailStart] = useState("");
  const [openEnded, setOpenEnded] = useState(false);
  const [availEnd, setAvailEnd] = useState("");

  // Step 2
  const [langs, setLangs] = useState<{ lang: string; level: string }[]>([{ lang: "", level: "Native" }]);

  // Step 3
  const [yearsExp, setYearsExp] = useState("");
  const [hasDiploma, setHasDiploma] = useState(false);
  const [diplomaName, setDiplomaName] = useState("");
  const [ageRanges, setAgeRanges] = useState<string[]>([]);

  // Step 4
  const [missions, setMissions] = useState<string[]>([]);

  // Step 5
  const [energy, setEnergy] = useState(3);
  const [structure, setStructure] = useState(3);
  const [warmth, setWarmth] = useState(3);
  const [creativity, setCreativity] = useState(3);
  const [discipline, setDiscipline] = useState(3);
  const [outdoor, setOutdoor] = useState(3);

  // Step 6
  const [rate, setRate] = useState("");
  const [transport, setTransport] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function addLang() { setLangs(l => [...l, { lang: "", level: "Fluent" }]); }
  function removeLang(i: number) { setLangs(l => l.filter((_, idx) => idx !== i)); }
  function updateLang(i: number, field: "lang" | "level", val: string) {
    setLangs(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in"); setSaving(false); return; }
    const profileId = user.user_metadata?.profileId;

    const langMap: Record<string, string> = {};
    langs.slice(0, 5).forEach((l, i) => { if (l.lang) langMap[`Language ${i + 1}`] = l.lang; });

    const { error } = await supabase.from("Babysitter").update({
      "Location": location,
      "Max Distance (km)": maxDist,
      "Availability Start Date": availStart,
      "Availability End Date": openEnded ? "Open" : availEnd,
      ...langMap,
      "Years of Experience": Number(yearsExp) || 0,
      "Comfortable Age Ranges": ageRanges.join(", "),
      "Proposed Missions": missions.join(", "),
      "↳ Energy (1-5)": energy,
      "↳ Structure (1-5)": structure,
      "↳ Warmth (1-5)": warmth,
      "↳ Creativity (1-5)": creativity,
      "↳ Discipline (1-5)": discipline,
      "↳ Outdoor Focus (1-5)": outdoor,
      "Notes": notes,
      "Profile Status": "Submitted",
    }).eq("Sitter ID", profileId);

    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success("Profile submitted!");
    navigate({ to: "/babysitter/dashboard" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00B4D8]/5 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00B4D8] text-white text-xl font-bold mb-3">K</div>
          <h1 className="text-xl font-bold text-gray-900">Complete your profile</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <ProgressBar step={step} />

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <div className="space-y-1.5">
                <Label>Nearest Metro / RER / Bus station</Label>
                <StationCombobox value={location} onChange={setLocation} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Max distance willing to travel</Label>
                  <span className="text-sm font-semibold text-[#00B4D8]">{maxDist} km</span>
                </div>
                <Slider min={0} max={30} step={1} value={[maxDist]} onValueChange={([v]) => setMaxDist(v)} className="[&>[role=slider]]:bg-[#00B4D8]" />
              </div>
              <div className="space-y-1.5">
                <Label>Availability start date</Label>
                <Input type="date" value={availStart} onChange={e => setAvailStart(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">Open-ended availability</p>
                <Switch checked={openEnded} onCheckedChange={setOpenEnded} className="data-[state=checked]:bg-[#00B4D8]" />
              </div>
              {!openEnded && (
                <div className="space-y-1.5">
                  <Label>Availability end date</Label>
                  <Input type="date" value={availEnd} onChange={e => setAvailEnd(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Languages</h2>
              {langs.map((l, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label>Language {i + 1}</Label>
                    <Select value={l.lang} onValueChange={v => updateLang(i, "lang", v)}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-36 space-y-1.5">
                    <Label>Level</Label>
                    <Select value={l.level} onValueChange={v => updateLang(i, "level", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANG_LEVELS.map(lv => <SelectItem key={lv} value={lv}>{lv}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {langs.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeLang(i)}><X className="h-4 w-4" /></Button>}
                </div>
              ))}
              {langs.length < 5 && (
                <Button type="button" variant="outline" onClick={addLang} className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add language
                </Button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Experience & Qualifications</h2>
              <div className="space-y-1.5">
                <Label>Years of experience with children</Label>
                <Input type="number" min={0} max={30} step={0.5} value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="e.g. 3" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">I have a childcare diploma</p>
                <Switch checked={hasDiploma} onCheckedChange={setHasDiploma} className="data-[state=checked]:bg-[#00B4D8]" />
              </div>
              {hasDiploma && (
                <div className="space-y-1.5">
                  <Label>Diploma name</Label>
                  <Input value={diplomaName} onChange={e => setDiplomaName(e.target.value)} placeholder="e.g. CAP Petite Enfance" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Comfortable age ranges</Label>
                <MultiCheck options={AGE_RANGES} selected={ageRanges} onChange={setAgeRanges} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Proposed Missions</h2>
              <p className="text-sm text-gray-500">Select all missions you're comfortable with</p>
              <MultiCheck options={MISSIONS} selected={missions} onChange={setMissions} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Your Personality</h2>
              <p className="text-sm text-gray-500">Rate yourself on each dimension (1–5)</p>
              <SliderField label="Energy" desc={["Calm", "Energetic"]} value={energy} onChange={setEnergy} />
              <SliderField label="Structure" desc={["Flexible", "Structured"]} value={structure} onChange={setStructure} />
              <SliderField label="Warmth" desc={["Professional", "Very warm"]} value={warmth} onChange={setWarmth} />
              <SliderField label="Creativity" desc={["Practical", "Very creative"]} value={creativity} onChange={setCreativity} />
              <SliderField label="Discipline" desc={["Gentle", "Firm"]} value={discipline} onChange={setDiscipline} />
              <SliderField label="Outdoor Focus" desc={["Indoor", "Outdoor"]} value={outdoor} onChange={setOutdoor} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Additional Information</h2>
              <div className="space-y-1.5">
                <Label>Desired hourly rate (€)</Label>
                <Input value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 12" type="number" min={0} />
              </div>
              <div className="space-y-2">
                <Label>Transport modes</Label>
                <MultiCheck options={["Car","Metro","Bus","Bike","Walking"]} selected={transport} onChange={setTransport} />
              </div>
              <div className="space-y-1.5">
                <Label>Profile summary / notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Tell families a little about yourself…" />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 pt-6 border-t">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => (s - 1) as any)} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={() => setStep(s => (s + 1) as any)} className="flex-1 bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={saving} className="flex-1 bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Submit profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
