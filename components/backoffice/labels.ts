export const huntStatusLabel: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
};

export const huntVisibilityLabel: Record<string, string> = {
  PUBLIC: "Publique",
  PRIVATE: "Privée",
};

export const difficultyLabel: Record<string, string> = {
  EASY: "Facile",
  MEDIUM: "Moyen",
  HARD: "Difficile",
};

export function label(
  map: Record<string, string>,
  value: string,
): string {
  return map[value] ?? value;
}
