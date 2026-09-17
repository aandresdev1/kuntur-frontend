import type { AttendanceStatus, Student, UUID } from "@/types/domain";

export interface AttendanceDictationResult {
  proposed: Record<UUID, AttendanceStatus>;
  changedIds: Set<UUID>;
  notRecognized: string[];
}

// Parses a dictated attendance transcript into per-student proposed statuses.
// Rules:
//  - "todos presentes" → everyone `present`
//  - "menos/excepto/salvo X" → X marked `absent` by default (user can edit)
//  - "<Name> falta|tarde|presente" → applies that status to that student
//  - Names that do not match any full name → returned in notRecognized
export function parseAttendanceDictation(
  transcript: string,
  students: readonly Student[],
  currentStatusByStudent: Record<UUID, AttendanceStatus>,
): AttendanceDictationResult {
  const lc = (transcript ?? "").toLowerCase();
  const proposed: Record<UUID, AttendanceStatus> = { ...currentStatusByStudent };
  const changedIds = new Set<UUID>();

  const setStatus = (id: UUID, next: AttendanceStatus) => {
    if (proposed[id] !== next) changedIds.add(id);
    proposed[id] = next;
  };

  if (
    /(todos\s+(est[aá]n\s+)?presentes|presentes\s+todos|todos\s+asisten|han\s+asistido\s+todos)/.test(
      lc,
    )
  ) {
    students.forEach((s) => setStatus(s.id_student, "present"));
  }

  const notRecognized: string[] = [];
  const exceptRe =
    /(?:menos|excepto|salvo)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,60}?)(?=\s+(?:que|y|,|\.|$))/gi;
  let match: RegExpExecArray | null;
  while ((match = exceptRe.exec(lc)) !== null) {
    const chunk = match[1]!.trim();
    const student = students.find((s) =>
      chunk.includes(s.full_name.toLowerCase()),
    );
    if (student) {
      setStatus(student.id_student, "absent");
    } else {
      notRecognized.push(chunk.replace(/^\w/, (c) => c.toUpperCase()));
    }
  }

  students.forEach((s) => {
    const nom = s.full_name.toLowerCase();
    const idx = lc.indexOf(nom);
    if (idx === -1) return;
    const window = lc.slice(idx, idx + nom.length + 45);
    if (/tarde|tard[ií]a|tardanza|lleg[oó]\s+tarde/.test(window)) {
      setStatus(s.id_student, "late");
    } else if (/falta|no\s+vino|ausente|no\s+asisti/.test(window)) {
      setStatus(s.id_student, "absent");
    } else if (/presente|vino|asisti[oó]|s[ií]\s+vino/.test(window)) {
      setStatus(s.id_student, "present");
    }
  });

  return { proposed, changedIds, notRecognized };
}
