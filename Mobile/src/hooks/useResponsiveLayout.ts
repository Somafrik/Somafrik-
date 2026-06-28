import { useWindowDimensions } from "react-native";

export const TABLET_MIN_WIDTH = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const columns = isTablet ? 2 : 1;
  const contentMaxWidth = isTablet ? 960 : width;
  const horizontalPadding = isTablet ? 32 : 20;

  return {
    width,
    height,
    isTablet,
    columns,
    contentMaxWidth,
    horizontalPadding,
    gridGap: isTablet ? 16 : 14,
  };
}
