import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useAppStore } from '@/lib/store';

export function BackgroundDisplay() {
  const { background } = useAppStore();

  if (background === 'dark') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0a0f' }]} pointerEvents="none" />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {background === 'gradient' && (
        <>
          <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="50" y="100" width="400" height="400" fill="url(#purpleGlow)" />
            <Rect x="550" y="550" width="450" height="450" fill="url(#blueGlow)" />
            <Rect x="300" y="350" width="350" height="350" fill="url(#pinkGlow)" />
          </Svg>
        </>
      )}

      {background === 'mountain' && (
        <>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f172a']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg
            style={styles.bottomSvg60}
            viewBox="0 0 1440 600"
            preserveAspectRatio="none"
          >
            <Path
              fill="#1e293b"
              opacity={0.6}
              d="M0,600 L0,300 Q200,200 400,280 T800,250 T1200,300 L1440,280 L1440,600 Z"
            />
            <Path
              fill="#0f172a"
              opacity={0.8}
              d="M0,600 L0,400 Q300,320 600,380 T1000,350 T1440,400 L1440,600 Z"
            />
            <Path
              fill="rgba(255,255,255,0.03)"
              d="M0,600 L0,450 Q400,380 800,420 T1440,400 L1440,600 Z"
            />
          </Svg>
        </>
      )}

      {background === 'library' && (
        <>
          <LinearGradient
            colors={['#1a1510', '#2c2416', '#1a1510']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg
            style={styles.bottomSvg70}
            viewBox="0 0 1440 800"
            preserveAspectRatio="none"
          >
            {[0, 1, 2, 3, 4].map((row) => (
              <G key={row}>
                <Rect
                  x="0"
                  y={400 + row * 70}
                  width="1440"
                  height="4"
                  fill="#4a3c2a"
                  opacity={0.8}
                />
                {Array.from({ length: 20 }).map((_, i) => {
                  const widths = [
                    28, 32, 35, 30, 38, 25, 33, 29, 36, 31, 27, 34, 30, 28, 35, 32, 29, 37, 26, 33,
                  ];
                  const fills = ['#8b5a2b', '#6b4423', '#a0522d', '#7b3f00', '#5c3317'];
                  return (
                    <Rect
                      key={i}
                      x={i * 72 + 10}
                      y={400 + row * 70 + 4}
                      width={widths[i]}
                      height={60}
                      fill={fills[i % 5]}
                      opacity={0.7}
                      rx={1}
                    />
                  );
                })}
              </G>
            ))}
          </Svg>
        </>
      )}

      {background === 'cafe' && (
        <>
          <LinearGradient
            colors={['#1a1410', '#2c1f14', '#1a1410']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={StyleSheet.absoluteFill}>
            {/* Window frame */}
            <View style={styles.cafeWindowFrame}>
              <LinearGradient
                colors={['rgba(253, 230, 138, 0.12)', 'rgba(254, 243, 199, 0.04)']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Coffee cup silhouette */}
            <View style={styles.cafeCup} />

            {/* Ambient warm glow right */}
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="500" y="600" width="450" height="350" fill="url(#amberGlow)" />
            </Svg>

            {/* Small lamp/shelf right accent */}
            <View style={styles.cafeLampAccent} />
          </View>
        </>
      )}

      {background === 'anime-room' && (
        <>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={StyleSheet.absoluteFill}>
            {/* Sunset window */}
            <View style={styles.animeWindow}>
              <LinearGradient
                colors={[
                  'rgba(254, 215, 170, 0.25)',
                  'rgba(251, 207, 232, 0.15)',
                  'rgba(216, 180, 254, 0.2)',
                ]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.animeWindowInnerGlow}>
                <LinearGradient
                  colors={['rgba(254, 243, 199, 0.35)', 'rgba(254, 215, 170, 0.2)']}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>

            {/* Floor gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(15, 52, 96, 0.85)']}
              style={styles.animeFloor}
            />

            {/* Silhouettes */}
            <View style={[styles.animeSilhouette, { left: '10%', height: 80, width: 60, backgroundColor: 'rgba(49, 46, 129, 0.35)' }]} />
            <View style={[styles.animeSilhouette, { left: '26%', height: 70, width: 50, backgroundColor: 'rgba(88, 28, 135, 0.25)' }]} />
            <View style={[styles.animeSilhouette, { left: '42%', height: 90, width: 70, backgroundColor: 'rgba(55, 48, 163, 0.3)' }]} />
            <View style={[styles.animeSilhouette, { right: '18%', height: 60, width: 80, backgroundColor: 'rgba(131, 24, 67, 0.25)' }]} />

            {/* String light accent */}
            <View style={styles.animeStringLight} />
          </View>
        </>
      )}

      {/* Backdrop overlay for text contrast */}
      <View style={styles.backdropOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSvg60: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '60%',
    opacity: 0.6,
  },
  bottomSvg70: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '70%',
    opacity: 0.5,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cafeWindowFrame: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: 160,
    height: 200,
    borderWidth: 3,
    borderColor: 'rgba(120, 53, 15, 0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(69, 26, 3, 0.25)',
    overflow: 'hidden',
  },
  cafeCup: {
    position: 'absolute',
    bottom: '18%',
    left: '22%',
    width: 36,
    height: 44,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: 'rgba(120, 53, 15, 0.25)',
  },
  cafeLampAccent: {
    position: 'absolute',
    top: '38%',
    right: '15%',
    width: 36,
    height: 46,
    borderWidth: 2,
    borderColor: 'rgba(120, 53, 15, 0.25)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(120, 53, 15, 0.15)',
  },
  animeWindow: {
    position: 'absolute',
    top: '6%',
    left: '12%',
    width: 220,
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    opacity: 0.7,
  },
  animeWindowInnerGlow: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '80%',
    height: '60%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  animeFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  animeSilhouette: {
    position: 'absolute',
    bottom: '8%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  animeStringLight: {
    position: 'absolute',
    top: '16%',
    left: '45%',
    width: 100,
    height: 2,
    backgroundColor: 'rgba(253, 230, 138, 0.35)',
    transform: [{ rotate: '-15deg' }],
  },
});
