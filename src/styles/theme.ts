import type { ThemeConfig } from 'antd';

export const BRAND = {
  gold: '#f9c556',
  goldDark: '#d4a23a',
  goldLight: '#fce8b2',
  dark: '#2c2c2c',
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND.gold,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: BRAND.gold,
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: '#f5f5f5',
    colorText: '#111111',
    colorTextHeading: '#111111',
  },
  components: {
    Layout: {
      siderBg: '#141414',
      headerBg: '#ffffff',
      headerHeight: 56,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(249, 197, 86, 0.12)',
      darkItemHoverBg: 'rgba(249, 197, 86, 0.08)',
      darkItemSelectedColor: BRAND.gold,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Button: {
      primaryColor: BRAND.dark,
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Progress: {
      defaultColor: '#111111',
      remainingColor: '#e5e5e5',
    },
  },
};
