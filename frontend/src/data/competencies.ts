import type { Competency, UUID } from "@/types/domain";
import type { CompetencyTone } from "@/components/CompetencyIcon";
import type { ObservationTag } from "@/lib/classifiers";

// Competencies catalog aligned to MINEDU competencies (CONTRACT §12).
// The `tone` and `short_label` are UI-facing metadata layered on top of Competency.

export interface CompetencyPresentation extends Competency {
  short_label: string;
  tone: CompetencyTone;
}

export const COMPETENCIES: CompetencyPresentation[] = [
  {
    id_competency: "cmp_convive",
    name: "Convive y participa democráticamente",
    short_label: "Convivencia",
    tone: "green",
  },
  {
    id_competency: "cmp_comunica",
    name: "Se comunica oralmente en su lengua materna",
    short_label: "Comunicación",
    tone: "pen",
  },
  {
    id_competency: "cmp_resuelve_cantidad",
    name: "Resuelve problemas de cantidad",
    short_label: "Resuelve problemas",
    tone: "pen",
  },
  {
    id_competency: "cmp_identidad",
    name: "Construye su identidad",
    short_label: "Identidad",
    tone: "amber",
  },
  {
    id_competency: "cmp_indaga",
    name: "Indaga mediante métodos científicos",
    short_label: "Indaga",
    tone: "green",
  },
  {
    id_competency: "cmp_arte",
    name: "Crea proyectos desde los lenguajes artísticos",
    short_label: "Arte",
    tone: "pen",
  },
];

const BY_ID: Record<UUID, CompetencyPresentation> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.id_competency, c]),
);

const BY_NAME: Record<string, CompetencyPresentation> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.name, c]),
);

export function findCompetencyById(
  id_competency: UUID,
): CompetencyPresentation | null {
  return BY_ID[id_competency] ?? null;
}

export function findCompetencyByName(
  name: string,
): CompetencyPresentation | null {
  return BY_NAME[name] ?? null;
}

// Suggests a competency for a dictated observation tag — demo heuristic.
const TAG_TO_COMPETENCY_ID: Record<ObservationTag, UUID> = {
  socioemocional: "cmp_convive",
  conducta: "cmp_convive",
  avance: "cmp_resuelve_cantidad",
  apoyo: "cmp_comunica",
  salud: "cmp_identidad",
};

export function suggestCompetencyForTag(
  tag: ObservationTag,
): CompetencyPresentation {
  const id = TAG_TO_COMPETENCY_ID[tag];
  return BY_ID[id]!;
}
