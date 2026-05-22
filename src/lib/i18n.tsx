import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type Lang = "fr" | "en";

type Dict = Record<string, { fr: string; en: string }>;

const D: Dict = {
  // Sections
  overview: { fr: "Vue d'ensemble", en: "Overview" },
  people: { fr: "Personnes", en: "People" },
  operations: { fr: "Opérations", en: "Operations" },
  matchingSection: { fr: "Matching", en: "Matching" },
  // Nav
  dashboard: { fr: "Tableau de bord", en: "Dashboard" },
  alerts: { fr: "Alertes", en: "Alerts" },
  pipeline: { fr: "Pipeline", en: "Pipeline" },
  babysitters: { fr: "Baby-sitters", en: "Babysitters" },
  parents: { fr: "Parents", en: "Parents" },
  interviews: { fr: "Entretiens", en: "Interviews" },
  requests: { fr: "Demandes", en: "Requests" },
  reservations: { fr: "Réservations", en: "Reservations" },
  contracts: { fr: "Contrats", en: "Contracts" },
  matching: { fr: "Matching", en: "Matching" },
  // Headings
  brand: { fr: "Kiddobee Admin", en: "Kiddobee Admin" },
  approvedBabysitters: { fr: "Baby-sitters approuvés", en: "Approved Babysitters" },
  openRequests: { fr: "Demandes ouvertes", en: "Open Requests" },
  upcomingReservations: { fr: "Réservations à venir", en: "Upcoming Reservations" },
  pendingInterviews: { fr: "Entretiens en attente", en: "Pending Interviews" },
  recentAlerts: { fr: "Alertes récentes", en: "Recent Alerts" },
  // Pipeline stages
  st_new: { fr: "Nouveau", en: "New" },
  st_profile: { fr: "Profil à valider", en: "Profile review" },
  st_docs: { fr: "Documents en attente", en: "Documents pending" },
  st_hr: { fr: "Entretien RH planifié", en: "HR interview scheduled" },
  // Table headers
  name: { fr: "Nom", en: "Name" },
  stage: { fr: "Étape", en: "Stage" },
  city: { fr: "Ville", en: "City" },
  joined: { fr: "Inscrit le", en: "Joined" },
  email: { fr: "E-mail", en: "Email" },
  type: { fr: "Type", en: "Type" },
  candidate: { fr: "Candidat", en: "Candidate" },
  scheduled: { fr: "Planifié", en: "Scheduled" },
  status: { fr: "Statut", en: "Status" },
  parent: { fr: "Parent", en: "Parent" },
  babysitter: { fr: "Baby-sitter", en: "Babysitter" },
  start: { fr: "Début", en: "Start" },
  end: { fr: "Fin", en: "End" },
  created: { fr: "Créé le", en: "Created" },
  rank: { fr: "Rang", en: "Rank" },
  score: { fr: "Score", en: "Score" },
  tier: { fr: "Niveau", en: "Tier" },
  // Matching
  matchingWorkbench: { fr: "Banc de matching", en: "Matching workbench" },
  matchingSubtitle: {
    fr: "Évaluez les baby-sitters pour un parent",
    en: "Score babysitters against a parent",
  },
  selectParent: { fr: "Sélectionner un parent…", en: "Select a parent…" },
  recalculate: { fr: "Recalculer les scores", en: "Recalculate scores" },
  recalculating: { fr: "Recalcul en cours…", en: "Recalculating…" },
  // Misc
  loading: { fr: "Chargement…", en: "Loading…" },
  empty: { fr: "Aucune donnée", en: "No data" },
  noParentSelected: { fr: "Sélectionnez un parent pour voir les correspondances.", en: "Select a parent to see matches." },
  // Interview types
  interview: { fr: "Entretien", en: "Interview" },
  hrInterview: { fr: "Entretien RH", en: "HR interview" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof D | string) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "fr", setLang: () => {}, t: (k) => String(k) });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("kb-lang") as Lang | null) : null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("kb-lang", l);
  };
  const t = (key: string) => {
    const entry = (D as Record<string, { fr: string; en: string }>)[key];
    return entry ? entry[lang] : key;
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center rounded-md border bg-card p-0.5 text-xs font-medium">
      <Button
        type="button"
        size="sm"
        variant={lang === "en" ? "default" : "ghost"}
        className="h-7 px-3 rounded-sm"
        onClick={() => setLang("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={lang === "fr" ? "default" : "ghost"}
        className="h-7 px-3 rounded-sm"
        onClick={() => setLang("fr")}
      >
        FR
      </Button>
    </div>
  );
}
