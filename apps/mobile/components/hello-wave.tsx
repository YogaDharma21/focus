import Animated from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <Sparkles size={28} color="#f59e0b" />
    </Animated.View>
  );
}
