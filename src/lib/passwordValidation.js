// ====================================================================
// PASSWORD VALIDATION — shared rules for login, register, reset
// ====================================================================

export const PASSWORD_RULES = [
  { id: 'len', label: 'Mínimo 8 caracteres', test: p => p.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Uma letra minúscula', test: p => /[a-z]/.test(p) },
  { id: 'num', label: 'Um número', test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'Um caractere especial (!@#$%)', test: p => /[^A-Za-z0-9]/.test(p) },
];

export function validatePassword(p) {
  return PASSWORD_RULES.every(r => r.test(p));
}
