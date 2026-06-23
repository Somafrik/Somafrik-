import { Platform } from "react-native";
import { useSafeAreaInsets, type EdgeInsets } from "react-native-safe-area-context";

export const FLOATING_TAB_BAR_HEIGHT = 76;
export const FLOATING_TAB_BAR_GAP = 10;
export const CONTENT_ABOVE_TAB_GAP = 16;

function getTabBarBottomOffset(insets: EdgeInsets): number {
  const minBottom = Platform.OS === "android" ? 12 : 8;
  return Math.max(insets.bottom, minBottom) + FLOATING_TAB_BAR_GAP;
}

export function computeFloatingTabBarLayout(insets: EdgeInsets) {
  const tabBarBottom = getTabBarBottomOffset(insets);
  const tabBarOccupiedHeight = FLOATING_TAB_BAR_HEIGHT + tabBarBottom;
  const scrollContentPaddingBottom = tabBarOccupiedHeight + CONTENT_ABOVE_TAB_GAP;

  return {
    tabBarBottom,
    tabBarOccupiedHeight,
    scrollContentPaddingBottom,
    tabBarStyle: {
      position: "absolute" as const,
      left: 16,
      right: 16,
      bottom: tabBarBottom,
      height: FLOATING_TAB_BAR_HEIGHT,
      backgroundColor: "#0F172A",
      borderRadius: 24,
      borderTopWidth: 0,
      paddingTop: 8,
      paddingBottom: 10,
      paddingHorizontal: 8,
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      overflow: "hidden" as const,
    },
  };
}

export function useFloatingTabBarLayout() {
  const insets = useSafeAreaInsets();
  return computeFloatingTabBarLayout(insets);
}

/** Bottom padding for stack screens (no floating tab bar). */
export function useStackScreenBottomPadding(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 16) + 24;
}
