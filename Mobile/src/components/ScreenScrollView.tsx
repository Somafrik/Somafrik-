import React from "react";
import { ScrollView, type ScrollViewProps, StyleSheet } from "react-native";
import { useFloatingTabBarLayout, useStackScreenBottomPadding } from "../lib/screenLayout";

type Props = ScrollViewProps & {
  /** When true (default), reserves space for the floating tab bar. */
  withTabBar?: boolean;
};

export default function ScreenScrollView({
  withTabBar = true,
  contentContainerStyle,
  style,
  ...rest
}: Props) {
  const { scrollContentPaddingBottom } = useFloatingTabBarLayout();
  const stackPaddingBottom = useStackScreenBottomPadding();
  const paddingBottom = withTabBar ? scrollContentPaddingBottom : stackPaddingBottom;

  return (
    <ScrollView
      style={[styles.flex, style]}
      contentContainerStyle={[contentContainerStyle, { paddingBottom }]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
