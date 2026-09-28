import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export const FLOATING_TAB_BAR_HEIGHT = 60;
export const FLOATING_TAB_BAR_BOTTOM_GAP = 12;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 0) + FLOATING_TAB_BAR_BOTTOM_GAP }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              if (process.env.EXPO_OS === 'ios') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isFocused && { backgroundColor: colors.muted }]}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.tabIconSelected : colors.tabIconDefault,
                size: 22,
              })}
              {isFocused && (
                <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
