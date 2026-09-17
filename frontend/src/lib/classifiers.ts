// Heuristic tag classification used by the demo when a user dictates an observation.
// These are display tags, not the CONTRACT `id_competency` — the mapping lives in
// suggestCompetencyFromTag below.

export type ObservationTag =
  | "salud"
  | "conducta"
  | "apoyo"
  | "socioemocional"
  | "avance";

const TAG_LABELS_ES: Record<ObservationTag, string> = {
  salud: "Salud",
  conducta: "Conducta",
  apoyo: "Apoyo",
  socioemocional: "Socioemocional",
  avance: "Avance",
};

export function observationTagLabel(tag: ObservationTag): string {
  return TAG_LABELS_ES[tag];
}

export function classifyObservationTag(input: string): ObservationTag {
  const lc = (input ?? "").toLowerCase();
  if (/(gripe|dolor|fiebre|t[oó]pico|alergia|malestar|v[oó]mit)/.test(lc)) {
    return "salud";
  }
  if (/(molest|golpe|interrump|distraj|pele[oó]|no sigui[oó])/.test(lc)) {
    return "conducta";
  }
  if (/(le cost[oó]|se frustr[oó]|no pudo|le cuesta|apoyo|refuerzo)/.test(lc)) {
    return "apoyo";
  }
  if (/(compart|ayud|amig|solidari|esper[oó] su turno|se acerc)/.test(lc)) {
    return "socioemocional";
  }
  if (
    /(logr[oó]|clasific|cont[oó]|reconoci[oó]|ley[oó]|escrib|arm[oó]|construy|explic)/.test(
      lc,
    )
  ) {
    return "avance";
  }
  return "socioemocional";
}

// Demo-only: turns a dictated announcement into a coarse UI type label.
// Real system uses AnnouncementType from CONTRACT (informative | authorization).
export type DictatedAnnouncementKind =
  | "authorization"
  | "reminder"
  | "informative";

export function classifyDictatedAnnouncement(
  input: string,
): DictatedAnnouncementKind {
  const lc = (input ?? "").toLowerCase();
  if (/(autoriz|firmar|permiso)/.test(lc)) return "authorization";
  if (/(recorda|reuni[oó]n|entregar|traer|convoca)/.test(lc)) return "reminder";
  return "informative";
}
