const ADMIN_EMAILS = [
  'luca.lombino@icloud.com',
  'da-hauspokal-orga@outlook.com',
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
