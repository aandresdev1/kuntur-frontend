import type { UUID } from "@/types/domain";
import type { CompetencyTone } from "@/components/CompetencyIcon";
import type { ObservationTag } from "@/lib/classifiers";
import { firstName } from "@/lib/text";
import { findCompetencyByName } from "./competencies";
import { findStudentById } from "./students";

// Timeline entry as rendered by the ficha del alumno — richer than the raw
// Observation entity because it includes cosmetic labels, colors and mock
// non-observation rows (Evidencia / Cuaderno).
export interface TimelineEntry {
  when_label: string;
  entry_kind: "observation" | "evidence" | "notebook";
  chip_label: string;
  chip_tone: CompetencyTone | "amber";
  content: string;
  competency_name: string | null;
}

export const TIMELINE_VALENTINA: TimelineEntry[] = [
  {
    when_label: "Hoy · 10:40",
    entry_kind: "observation",
    chip_label: "Socioemocional",
    chip_tone: "green",
    content:
      "Compartió sus bloques con Mateo sin que nadie se lo pidiera y le explicó cómo armar la base de la torre.",
    competency_name: "Convive y participa democráticamente",
  },
  {
    when_label: "Ayer · 11:15",
    entry_kind: "evidence",
    chip_label: "Foto",
    chip_tone: "pen",
    content:
      "Torre de 12 bloques clasificados por color y tamaño. Verbalizó: “los grandes van abajo para que no se caiga”.",
    competency_name: "Resuelve problemas de cantidad",
  },
  {
    when_label: "Vie 18 · 8:05",
    entry_kind: "observation",
    chip_label: "Apoyo",
    chip_tone: "amber",
    content:
      "Le costó despedirse de mamá al llegar (≈10 min). Se calmó con la rutina del calendario y participó normal el resto de la mañana.",
    competency_name: "Construye su identidad",
  },
  {
    when_label: "Jue 17",
    entry_kind: "notebook",
    chip_label: "Firmado",
    chip_tone: "green",
    content:
      "Autorización de salida al Parque de las Leyendas — firmada por Carlos Torres (papá).",
    competency_name: null,
  },
  {
    when_label: "Mar 15 · 9:30",
    entry_kind: "observation",
    chip_label: "Comunicación",
    chip_tone: "pen",
    content:
      "Reconoce su nombre escrito y el de tres compañeros en las tarjetas de asistencia.",
    competency_name: "Se comunica oralmente en su lengua materna",
  },
];

// Pool of generic observation snippets used to fabricate timelines for students
// other than Valentina — keeps the demo populated without hand-writing per-child data.
interface ObservationPoolEntry {
  tag: ObservationTag;
  tone: CompetencyTone;
  fragment: string;
  competency_name: string;
}

export const OBSERVATION_POOL: ObservationPoolEntry[] = [
  { tag: "socioemocional", tone: "green", fragment: "compartió sus materiales con un compañero durante el juego libre.",         competency_name: "Convive y participa democráticamente" },
  { tag: "avance",         tone: "pen",   fragment: "clasificó objetos por color y tamaño con poca ayuda.",                     competency_name: "Resuelve problemas de cantidad" },
  { tag: "socioemocional", tone: "green", fragment: "reconoció su nombre escrito entre las tarjetas de asistencia.",             competency_name: "Se comunica oralmente en su lengua materna" },
  { tag: "avance",         tone: "pen",   fragment: "armó una torre de bloques y explicó cómo la construyó.",                    competency_name: "Indaga mediante métodos científicos" },
  { tag: "socioemocional", tone: "green", fragment: "ayudó a ordenar los materiales al terminar la actividad.",                  competency_name: "Convive y participa democráticamente" },
  { tag: "conducta",       tone: "pen",   fragment: "se mantuvo concentrado durante toda la actividad de pintura.",              competency_name: "Crea proyectos desde los lenguajes artísticos" },
];

const TIMELINE_STUB_DATES = [
  "Hoy · 10:20",
  "Ayer · 11:05",
  "Vie 18 · 9:15",
  "Jue 17 · 8:40",
  "Mar 15 · 10:50",
];

// Number of observations per student — pre-computed for the demo so the roster
// counts stay stable. Real system derives from Observation rows.
export const OBSERVATION_COUNT_BY_STUDENT: Record<UUID, number> = {
  stu_valentina_torres: 5,
  stu_mateo_quispe:     3,
  stu_luciana_flores:   2,
  stu_thiago_ramos:     4,
  stu_emma_castillo:    1,
  stu_gael_huaman:      2,
  stu_sofia_paredes:    3,
  stu_adrian_vega:      0,
  stu_mia_rojas:        2,
  stu_liam_chavez:      1,
};

// Fabricates a timeline for a given student. Special-cases Valentina to return
// the hand-written timeline; everyone else gets a deterministic sample from
// OBSERVATION_POOL keyed by their id.
export function generateTimelineFor(id_student: UUID): TimelineEntry[] {
  const student = findStudentById(id_student);
  if (!student) return [];
  if (student.full_name === "Valentina Torres") return TIMELINE_VALENTINA;

  const n = Math.min(OBSERVATION_COUNT_BY_STUDENT[id_student] ?? 0, 4);
  if (n === 0) return [];

  const seed = id_student
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const nom = firstName(student.full_name);

  const out: TimelineEntry[] = [];
  for (let k = 0; k < n; k++) {
    const p = OBSERVATION_POOL[(seed + k) % OBSERVATION_POOL.length]!;
    out.push({
      when_label: TIMELINE_STUB_DATES[k % TIMELINE_STUB_DATES.length]!,
      entry_kind: k % 3 === 1 ? "evidence" : "observation",
      chip_label:
        p.tag === "socioemocional"
          ? "Socioemocional"
          : p.tag === "avance"
            ? "Avance"
            : "Comunicación",
      chip_tone: p.tone,
      content: nom + " " + p.fragment,
      competency_name: p.competency_name,
    });
  }
  return out;
}

// Short "competency chips" summarizing a student's progress.
export interface CompetencyChip {
  tone: CompetencyTone | "amber";
  label: string;
}

export function generateCompetencyChipsFor(id_student: UUID): CompetencyChip[] {
  const student = findStudentById(id_student);
  if (!student) return [];
  if (student.full_name === "Valentina Torres") {
    return [
      { tone: "green", label: "Convivencia ↑" },
      { tone: "pen",   label: "Cantidad ↑" },
      { tone: "amber", label: "Adaptación en llegada" },
    ];
  }
  const count = OBSERVATION_COUNT_BY_STUDENT[id_student] ?? 0;
  if (!count) return [];
  const seed = id_student
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const a = OBSERVATION_POOL[seed % OBSERVATION_POOL.length]!;
  const b = OBSERVATION_POOL[(seed + 2) % OBSERVATION_POOL.length]!;
  return [
    { tone: a.tone, label: (findCompetencyByName(a.competency_name)?.short_label ?? "") + " ↑" },
    { tone: b.tone, label: (findCompetencyByName(b.competency_name)?.short_label ?? "") + " ↑" },
  ];
}

// Descriptive conclusion (CONTRACT §14). Hand-written for Valentina, templated
// for everyone else. This is a demo generator — real system calls the AI backend.
const CONCLUSION_VALENTINA = `LOGROS — Valentina muestra un avance sostenido en la convivencia: comparte materiales por iniciativa propia y explica sus ideas a sus compañeros durante el juego (obs. 24/07). En la competencia “Resuelve problemas de cantidad”, clasifica objetos por dos criterios (color y tamaño) y anticipa relaciones de equilibrio al construir (evid. 23/07). Reconoce su nombre escrito y el de otros niños (obs. 15/07).

DIFICULTADES — En algunos inicios de jornada aún requiere acompañamiento para separarse de su familia; la rutina del calendario le ayuda a regularse (obs. 18/07).

RECOMENDACIONES — Mantener la rutina de llegada anticipándole en casa lo que hará en el aula. Ofrecer nuevos retos de clasificación con tres criterios y roles de “ayudante” que aprovechen su disposición a explicar a otros.`;

export const WEEKLY_SUMMARY_VALENTINA = `Valentina tuvo una gran semana. Siguió avanzando en sus juegos de construcción —ya clasifica bloques por color y tamaño y explica por qué “los grandes van abajo”— y la profesora destacó un gesto muy lindo: compartió sus materiales con un compañero sin que nadie se lo pidiera. El viernes le costó un poquito despedirse en la mañana, algo normal a su edad; la rutina del calendario la ayudó a calmarse rápido. Para casa: pueden jugar a agrupar objetos (tapas, cucharas) por tamaño y color, le encanta.`;

export function generateDescriptiveConclusionFor(id_student: UUID): string {
  const student = findStudentById(id_student);
  if (!student) return "";
  if (student.full_name === "Valentina Torres") return CONCLUSION_VALENTINA;

  const nom = firstName(student.full_name);
  const seed = id_student
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const a = OBSERVATION_POOL[seed % OBSERVATION_POOL.length]!;
  const b = OBSERVATION_POOL[(seed + 3) % OBSERVATION_POOL.length]!;

  return `LOGROS — ${nom} ${a.fragment} Muestra además avances consistentes en la competencia “${b.competency_name}” durante las actividades del aula.

DIFICULTADES — En algunos momentos ${nom} aún requiere acompañamiento para sostener la atención en tareas largas; responde bien a las rutinas del aula.

RECOMENDACIONES — Proponer retos graduales que amplíen estos logros y reforzar en casa con juego guiado que consolide los aprendizajes.`;
}
