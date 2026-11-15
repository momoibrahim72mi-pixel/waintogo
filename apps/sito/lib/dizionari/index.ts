// Dà il dizionario di una lingua: const t = dizionario(lingua); poi t.home.titolo e così via.
// I tre dizionari sono piccoli (pochi KB) e stanno sul server: nel browser arrivano solo
// i testi che passiamo ai componenti "use client" (menu, selettore, modulo).
import type { Lingua } from "../lingue";
import { ar } from "./ar";
import { en } from "./en";
import { it, type Dizionario } from "./it";

const DIZIONARI: Record<Lingua, Dizionario> = { it, en, ar };

export function dizionario(lingua: Lingua): Dizionario {
  return DIZIONARI[lingua];
}

export type { Dizionario, TestiModulo } from "./it";
