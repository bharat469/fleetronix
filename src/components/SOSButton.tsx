import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  ViewStyle,
} from 'react-native';
import { scale, moderateScale } from '../helpers/dimension';

interface SOSButtonProps {
  onLongPress: () => void;
  style?: ViewStyle;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onLongPress, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle continuous pulse
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handleLongPress = useCallback(() => {
    // Vibrate pattern: short-short-long for urgency feel
    Vibration.vibrate([0, 100, 50, 100, 50, 200]);
    onLongPress();
  }, [onLongPress]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={600}
      >
        <Text style={styles.text}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#CC2B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  button: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: '#CC2B2B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  text: {
    color: 'white',
    fontSize: moderateScale(13),
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default SOSButton;
