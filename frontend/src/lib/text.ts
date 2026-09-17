// Trim, capitalize the first letter and ensure the sentence ends with punctuation.
export function capitalizeSentence(input: string): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "";
  const capitalized = trimmed[0]!.toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : capitalized + ".";
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}
