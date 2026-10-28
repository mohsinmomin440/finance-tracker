export const APP_CONFIG = {
  name: 'Glassflow',
  tagline: 'Spend with intention.',
  emoji: '◈',
  icon: 'WalletCards',
  defaultTheme: 'dark',
  defaultLoginRoute: '/admin/login',
};

export const AUTH_PROFILES = [
  {
    id: 0,
    name: 'Admin_c',
    key: 'admin',
    label: 'Administrator',
    isDefault: false,
    isPublic: false,
    canManageTeam: true,
    reportsTo: null,
    redirectAfterAuth: '/',
    authPage: {
      loginTitle: 'Welcome back',
      signupTitle: 'Create account',
      loginDescription: 'Your money, made clearer.',
      signupDescription: 'Create your personal finance workspace.',
    },
  },
  {
    id: 1,
    name: 'Member_c',
    key: 'member',
    label: 'Member',
    isDefault: true,
    isPublic: false,
    canManageTeam: false,
    reportsTo: 'Admin_c',
    redirectAfterAuth: '/',
    authPage: {
      loginTitle: 'Welcome back',
      signupTitle: 'Start your money journey',
      loginDescription: 'Your money, made clearer.',
      signupDescription: 'Track spending with more intention.',
    },
  },
];

export const GENERIC_AUTH = {
  loginTitle: 'Welcome back',
  signupTitle: 'Create account',
  loginDescription: 'Your money, made clearer.',
  signupDescription: 'Create your personal finance workspace.',
  redirectAfterAuth: '/',
};
