import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading: user === undefined, role: user?.user_metadata?.role as string | undefined };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getNextId(
  table: "Parent" | "Babysitter",
  idColumn: string,
  prefix: string,
): Promise<string> {
  const { data } = await supabase
    .from(table)
    .select(`"${idColumn}"`)
    .order(idColumn, { ascending: false })
    .limit(10);
  if (!data || data.length === 0) return `${prefix}-001`;
  const nums = data
    .map((r: any) => {
      const v = r[idColumn] as string | null;
      if (!v) return 0;
      const n = parseInt(v.replace(`${prefix}-`, ""), 10);
      return isNaN(n) ? 0 : n;
    })
    .filter((n) => n > 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export const PARIS_METRO_STATIONS = [
  "Abbesses","Alexandre Dumas","Alma - Marceau","Anvers","Arts et Métiers",
  "Assemblée Nationale","Auber","Austerlitz","Avron","Balard",
  "Barbès - Rochechouart","Bastille","Belleville","Bercy","Bibliothèque François Mitterrand",
  "Bir-Hakeim","Blanche","Bonne Nouvelle","Bourse","Bréguet-Sabin",
  "Brochant","Cadet","Campo-Formio","Cardinal Lemoine","Censier - Daubenton",
  "Châtelet","Château de Vincennes","Château Rouge","Chemin Vert","Cité",
  "Colonel Fabien","Commerce","Concorde","Corvisart","Crimée",
  "Daumesnil","Denfert - Rochereau","Duroc","École Militaire","Edgar Quinet",
  "Exelmans","Faidherbe - Chaligny","Falguière","Félix Faure","Filles du Calvaire",
  "Gare de Lyon","Gare de l'Est","Gare du Nord","Garibaldi","Glacière",
  "Grands Boulevards","Guy Môquet","Havre - Caumartin","Hôtel de Ville","Invalides",
  "Iéna","Jacques Bonsergent","Jasmin","Javel","Jourdain",
  "Jules Joffrin","Jussieu","Kléber","La Chapelle","La Fourche",
  "La Motte-Picquet - Grenelle","Lamarck - Caulaincourt","Laumière","Ledru-Rollin","Liège",
  "Louis Blanc","Lourmel","Louvre - Rivoli","Mabillon","Madeleine",
  "Mairie d'Issy","Mairie d'Ivry","Mairie de Montreuil","Mairie des Lilas","Malesherbes",
  "Maubert - Mutualité","Ménilmontant","Michel Bizot","Mirabeau","Miromesnil",
  "Montgallet","Montparnasse - Bienvenüe","Mouton-Duvernet","Nation","Oberkampf",
  "Odéon","Olympiades","Opéra","Ourcq","Palais Royal - Musée du Louvre",
  "Parmentier","Pasteur","Pelleport","Père Lachaise","Pernety",
  "Philippe Auguste","Pigalle","Place d'Italie","Place de Clichy","Place des Fêtes",
  "Place Monge","Plaisance","Porte d'Auteuil","Porte d'Ivry","Porte d'Orléans",
  "Porte Dauphine","Porte de Bagnolet","Porte de Champerret","Porte de Charenton","Porte de Choisy",
  "Porte de Clichy","Porte de Clignancourt","Porte de la Chapelle","Porte de la Villette","Porte de Montreuil",
  "Porte de Pantin","Porte de Saint-Cloud","Porte de Saint-Ouen","Porte de Vanves","Porte de Versailles",
  "Porte de Vincennes","Porte des Lilas","Porte Maillot","Pyramides","Quatre Septembre",
  "Ranelagh","Raspail","Réaumur - Sébastopol","République","Richard-Lenoir",
  "Richelieu - Drouot","Rome","Rue de la Pompe","Rue du Bac","Saint-Ambroise",
  "Saint-Augustin","Saint-Fargeau","Saint-François-Xavier","Saint-Georges","Saint-Germain-des-Prés",
  "Saint-Jacques","Saint-Lazare","Saint-Marcel","Saint-Michel","Saint-Ouen",
  "Saint-Paul","Saint-Placide","Saint-Sébastien - Froissart","Saint-Sulpice","Solférino",
  "Stalingrad","Sully - Morland","Temple","Tolbiac","Trocadéro",
  "Tuileries","Varenne","Vaugirard","Vavin","Victor Hugo",
  "Villiers","Voltaire","Wagram","Charles de Gaulle - Étoile","Châtelet - Les Halles",
  "Nanterre","Clamart","Issy","Vincennes","Montreuil",
].sort();
