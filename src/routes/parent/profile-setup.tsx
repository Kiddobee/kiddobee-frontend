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
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/profile-setup")({
  head: () => ({ meta: [{ title: "Profile Setup — Kiddobee" }] }),
  component: ParentProfileSetup,
});

const MISSIONS = ["School Pickup","Homework Help","Bath Supervision","Dinner Prep","Snack Prep","Public Transport","Housekeeping","Activities & Playtime","Cooking","Laundry & Ironing","Travel with Family","Activity Escort","Supervising Outings"];
const AGE_RANGES = ["0-6 months","6-9 months","9-12 months","1-3 years","3-6 years","6+ years"];
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
      <div className="flex justify-between text-xs text-gray-400">
        <span>{desc[0]}</span><span>{desc[1]}</span>
      </div>
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

function ParentProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [location, setLocation] = useState("");
  const [arrondissement, setArrondissement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2
  const [numChildren, setNumChildren] = useState(1);
  const [childrenAges, setChildrenAges] = useState("");
  const [childrenGenders, setChildrenGenders] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [medicalNeeds, setMedicalNeeds] = useState("");

  // Step 3
  const [missions, setMissions] = useState<string[]>([]);
  const [daysRequired, setDaysRequired] = useState("");
  const [hoursRequired, setHoursRequired] = useState("");
  const [scheduleType, setScheduleType] = useState("");
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxWait, setMaxWait] = useState("");

  // Step 4
  const [langRequired, setLangRequired] = useState("");
  const [langStrict, setLangStrict] = useState(false);
  const [familyLang, setFamilyLang] = useState("");
  const [secondLang, setSecondLang] = useState("");
  const [ageRange, setAgeRange] = useState<string[]>([]);
  const [expRequired, setExpRequired] = useState(false);
  const [minExp, setMinExp] = useState("");

  // Step 5
  const [pEnergy, setPEnergy] = useState(3);
  const [pStructure, setPStructure] = useState(3);
  const [pWarmth, setPWarmth] = useState(3);
  const [pCreativity, setPCreativity] = useState(3);
  const [pDiscipline, setPDiscipline] = useState(3);
  const [pOutdoor, setPOutdoor] = useState(3);

  // Step 6
  const [music, setMusic] = useState(false);
  const [art, setArt] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [sports, setSports] = useState(false);
  const [longTerm, setLongTerm] = useState(false);
  const [driving, setDriving] = useState(false);
  const [gardePartagee, setGardePartagee] = useState(false);
  const [notes, setNotes] = useState("");
  const [prevSitter, setPrevSitter] = useState("");

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in"); setSaving(false); return; }
    const profileId = user.user_metadata?.profileId;
    const { error } = await supabase.from("Parent").update({
      "Location (Arrondissement / City)": location,
      "Arrondissement / Postal Code": postalCode,
      "Phone Number": phone,
      "Number of Children": numChildren,
      "Children's Ages": childrenAges,
      "Children's Genders": childrenGenders,
      "Children's School Location": schoolLocation,
      "Any Medical / Special Needs": medicalNeeds,
      "Missions Required": missions.join(", "),
      "Days Required": daysRequired,
      "Hours Required": hoursRequired,
      "Schedule Type": scheduleType,
      "Max Distance from Parent (km)": maxDistance,
      "Maximum waiting time": maxWait,
      "Language Required": langRequired,
      "Language Strict (Yes / No)": langStrict ? "Yes" : "No",
      "Family Language(s) at Home": familyLang,
      "Second Language": secondLang,
      "Age Range of Children (for matching)": ageRange.join(", "),
      "Experience Required (Yes / No)": expRequired ? "Yes" : "No",
      "Minimum Years of Experience": minExp,
      "Preferred Personality — Energy (1-5)": pEnergy,
      "Preferred Personality — Structure (1-5)": pStructure,
      "Preferred Personality — Warmth (1-5)": pWarmth,
      "Preferred Personality — Creativity (1-5)": pCreativity,
      "Preferred Personality — Discipline (1-5)": pDiscipline,
      "Preferred Personality — Outdoor Focus (1-5)": pOutdoor,
      "Musician / Music (Yes / No)": music ? "Yes" : "No",
      "Art and Craft (Yes / No)": art ? "Yes" : "No",
      "Dancing (Yes / No)": dancing ? "Yes" : "No",
      "Sports (Yes / No)": sports ? "Yes" : "No",
      "Long-term / Full School Year (Yes / No)": longTerm ? "Yes" : "No",
      "Driving License Required (Yes / No)": driving ? "Yes" : "No",
      "Garde Partagée / Shared Care (Yes / No)": gardePartagee ? "Yes" : "No",
      "Additional Notes / Special Requirements": notes,
      "Previous Sitter Name (if Trust Override)": prevSitter,
      "Profile Status": "Active",
    }).eq("Parent ID", profileId);
    setSaving(false);
    if (error) { toast.error("Failed to save profile: " + error.message); return; }
    toast.success("Profile complete!");
    navigate({ to: "/parent/matches" });
  }

  const yn = (v: boolean) => (
    <div className="flex items-center gap-3">
      <Switch checked={v} onCheckedChange={() => {}} className="data-[state=checked]:bg-[#00B4D8]" />
    </div>
  );

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
                <Label>Nearest Metro / RER station</Label>
                <StationCombobox value={location} onChange={setLocation} />
              </div>
              <div className="space-y-1.5">
                <Label>Arrondissement / City</Label>
                <Input value={arrondissement} onChange={e => setArrondissement(e.target.value)} placeholder="e.g. 75011 Paris" />
              </div>
              <div className="space-y-1.5">
                <Label>Postal code</Label>
                <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="75011" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" type="tel" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Children Details</h2>
              <div className="space-y-1.5">
                <Label>Number of children</Label>
                <Input type="number" min={1} max={10} value={numChildren} onChange={e => setNumChildren(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Children's ages</Label>
                <Input value={childrenAges} onChange={e => setChildrenAges(e.target.value)} placeholder="e.g. 4 years, 7 years" />
              </div>
              <div className="space-y-1.5">
                <Label>Children's genders</Label>
                <Input value={childrenGenders} onChange={e => setChildrenGenders(e.target.value)} placeholder="e.g. Girl, Boy" />
              </div>
              <div className="space-y-1.5">
                <Label>School location</Label>
                <Input value={schoolLocation} onChange={e => setSchoolLocation(e.target.value)} placeholder="e.g. École du Marais, 75004" />
              </div>
              <div className="space-y-1.5">
                <Label>Medical / special needs</Label>
                <Textarea value={medicalNeeds} onChange={e => setMedicalNeeds(e.target.value)} placeholder="Any allergies, medical conditions…" rows={3} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Care Requirements</h2>
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
                    {["Recurring afternoons","Recurring evenings","Occasional weekends","Full-time","Part-time","Flexible"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Babysitter Preferences</h2>
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
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Personality Preferences</h2>
              <p className="text-sm text-gray-500">Set your ideal babysitter's personality profile (1–5)</p>
              <SliderField label="Energy" desc={["Calm", "Energetic"]} value={pEnergy} onChange={setPEnergy} />
              <SliderField label="Structure" desc={["Flexible", "Structured"]} value={pStructure} onChange={setPStructure} />
              <SliderField label="Warmth" desc={["Professional", "Very warm"]} value={pWarmth} onChange={setPWarmth} />
              <SliderField label="Creativity" desc={["Practical", "Very creative"]} value={pCreativity} onChange={setPCreativity} />
              <SliderField label="Discipline" desc={["Gentle", "Firm"]} value={pDiscipline} onChange={setPDiscipline} />
              <SliderField label="Outdoor Focus" desc={["Indoor", "Outdoor"]} value={pOutdoor} onChange={setPOutdoor} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Additional Information</h2>
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
            </div>
          )}

          {/* Navigation */}
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
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Complete profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
