import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  StyleSheet,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface VolumeSliderProps {
  value: number; // Range 0 to 1
  onValueChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  trackHeight?: number;
  disabled?: boolean;
}

export function VolumeSlider({
  value,
  onValueChange,
  style,
  trackHeight = 8,
  disabled = false,
}: VolumeSliderProps) {
  const { colors } = useTheme();
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [trackPageX, setTrackPageX] = useState(0);

  const updateFromPosition = useCallback(
    (relativeX: number) => {
      if (disabled) return;
      if (trackWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, relativeX / trackWidth));
      // Continuous precision rounded to 2 decimal places (1% resolution: e.g. 0.01, 0.13, 0.37, 0.42, 0.68, 0.99)
      const rounded = Math.round(ratio * 100) / 100;
      onValueChange(rounded);
    },
    [disabled, onValueChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const localX = evt.nativeEvent.locationX;
          updateFromPosition(localX);
        },
        onPanResponderMove: (evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
          if (trackWidth > 0) {
            const relativeX = evt.nativeEvent.pageX - trackPageX;
            updateFromPosition(relativeX);
          } else {
            updateFromPosition(evt.nativeEvent.locationX);
          }
        },
      }),
    [trackPageX, trackWidth, updateFromPosition],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    trackRef.current?.measure(
      (
        _x: number,
        _y: number,
        width: number,
        _height: number,
        pageX: number,
        _pageY: number,
      ) => {
        if (width > 0) {
          setTrackWidth(width);
        }
        setTrackPageX(pageX);
      },
    );
  };

  const clamped = Math.max(0, Math.min(1, typeof value === 'number' ? value : 0.8));
  const percentString = `${Math.round(clamped * 100)}%` as any;

  return (
    <View
      ref={trackRef}
      onLayout={onLayout}
      {...(!disabled ? panResponder.panHandlers : {})}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.track,
          {
            height: trackHeight,
            backgroundColor: colors.muted,
            borderColor: colors.border,
            borderRadius: trackHeight / 2,
          },
        ]}
      >
          <View
            style={[
              styles.fill,
              {
                width: percentString,
                backgroundColor: colors.primary,
                borderRadius: trackHeight / 2,
              },
            ]}
          />
      </View>
      <View
        style={[
          styles.thumb,
          {
            left: percentString,
            backgroundColor: colors.text,
            borderColor: colors.card,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  disabled: {
    opacity: 0.4,
  },
  track: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginLeft: -7,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
});
