export const Roles = {
  PLAYER: "PLAYER",
  PARTNER: "PARTNER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

