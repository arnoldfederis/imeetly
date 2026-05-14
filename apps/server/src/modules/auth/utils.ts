export const PASSWORD_CRITERIA = [
  {
    id: "length_min",
    message: "At least 10 characters",
    passes: (p: string) => p.length >= 10,
  },
  {
    id: "has_number",
    message: "At least 1 number",
    passes: (p: string) => /\d/.test(p),
  },
  {
    id: "has_lower",
    message: "At least 1 lowercase letter",
    passes: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "has_upper",
    message: "At least 1 uppercase letter",
    passes: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "no_spaces",
    message: "Password cannot contain spaces",
    passes: (p: string) => !/\s/.test(p),
  },
] as const;

export function getViolations(password: string) {
  return PASSWORD_CRITERIA.filter((c) => !c.passes(password));
}

export function isPasswordValid(password: string) {
  return getViolations(password).length === 0;
}
