export const DISCIPLINES = [
  "Biological Sciences",
  "Business & Management",
  "Chemistry",
  "Computer Science & Information Technology",
  "Earth & Environmental Sciences",
  "Economics",
  "Education",
  "Engineering",
  "Health Sciences & Nursing",
  "History & Social Sciences",
  "Languages & Linguistics",
  "Law",
  "Mathematics & Statistics",
  "Philosophy & Ethics",
  "Physics & Astronomy",
  "Psychology",
  "Other",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];
