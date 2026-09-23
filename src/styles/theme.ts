import { theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

export const BRAND = {
  gold: '#f9c556',
  goldDark: '#d4a23a',
  goldLight: '#fce8b2',
  dark: '#2c2c2c',
} as const;

const lightTheme: ThemeConfig = {
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

const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...lightTheme.token,
    colorBgLayout: '#141414',
    colorText: '#f5f5f5',
    colorTextHeading: '#f5f5f5',
  },
  components: {
    ...lightTheme.components,
    Layout: {
      siderBg: '#141414',
      headerBg: '#141414',
      headerHeight: 56,
    },
    Progress: {
      defaultColor: '#f9c556',
      remainingColor: '#333333',
    },
  },
};

export const theme = lightTheme;

export function getAntdTheme(mode: ThemeMode): ThemeConfig {
  return mode === 'dark' ? darkTheme : lightTheme;
}
