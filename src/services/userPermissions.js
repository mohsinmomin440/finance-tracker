import { createPermissions } from '@/services/permissions';

export const PROFILES = {
  Admin_c: {
    label: 'Administrator',
    isDefault: false,
    isPublic: false,
    canManageTeam: true,
    reportsTo: null,
  },
  Member_c: {
    label: 'Member',
    isDefault: true,
    isPublic: false,
    canManageTeam: false,
    reportsTo: 'Admin_c',
  },
};

export const TABLE_PERMISSIONS = {
  Admin_c: {
    expenses_c: { access: 'Full' },
    budgets_c: { access: 'Full' },
  },
  Member_c: {
    expenses_c: { access: 'Full' },
    budgets_c: { access: 'Full' },
  },
};

export const { getProfileMeta, getTableAccess, getFieldAccess } = createPermissions(
  PROFILES,
  TABLE_PERMISSIONS,
);
