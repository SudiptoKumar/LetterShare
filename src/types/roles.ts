export type AdminRole = 'superadmin' | 'moderator' | 'finance' | 'support';

export type Permission =
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'content.moderate'
  | 'billing.read'
  | 'billing.refund'
  | 'audit.read'
  | 'system.impersonate';

export const rolePermissions: Record<AdminRole, Permission[]> = {
  superadmin: [
    'users.read',
    'users.update',
    'users.delete',
    'content.moderate',
    'billing.read',
    'billing.refund',
    'audit.read',
    'system.impersonate'
  ],
  moderator: ['users.read', 'content.moderate', 'audit.read'],
  finance: ['billing.read', 'billing.refund', 'audit.read'],
  support: ['users.read', 'users.update']
};