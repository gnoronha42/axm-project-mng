import { Grid } from 'antd';

const { useBreakpoint: useAntBreakpoint } = Grid;

/** Breakpoints alinhados ao Ant Design (md ≥ 768px, lg ≥ 992px). */
export function useBreakpoint() {
  const screens = useAntBreakpoint();
  const isMobile = screens.md === false;
  const isTablet = screens.md === true && screens.lg === false;
  const isDesktop = screens.lg === true;

  return { screens, isMobile, isTablet, isDesktop };
}
