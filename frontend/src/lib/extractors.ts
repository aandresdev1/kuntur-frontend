import { capitalizeSentence } from "./text";
import type { Student } from "@/types/domain";

export function extractTitle(input: string): string {
  const s = capitalizeSentence(input).replace(/[.!?]$/, "");
  const words = s.split(/\s+/);
  if (words.length <= 7) return s;
  return words.slice(0, 7).join(" ").replace(/[,;:]$/, "") + "…";
}

// Strict full-name (case-insensitive) match against a students list.
export function findMentionedStudent(
  input: string,
  students: readonly Student[],
): Student | null {
  const lc = (input ?? "").toLowerCase();
  return (
    students.find((s) => lc.includes(s.full_name.toLowerCase())) ?? null
  );
}
