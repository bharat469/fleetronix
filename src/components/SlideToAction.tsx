import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { scale, moderateScale } from '../helpers/dimension';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - scale(50);
const BUTTON_WIDTH = scale(60);

interface SlideToActionProps {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
}

const SlideToAction: React.FC<SlideToActionProps> = ({ label, onComplete, disabled }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isCompleted, setIsCompleted] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && !isCompleted,
    onMoveShouldSetPanResponder: () => !disabled && !isCompleted,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx >= 0 && gestureState.dx <= SLIDER_WIDTH - BUTTON_WIDTH) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx >= SLIDER_WIDTH - BUTTON_WIDTH - 20) {
        Animated.timing(translateX, {
          toValue: SLIDER_WIDTH - BUTTON_WIDTH,
          duration: 100,
          useNativeDriver: false,
        }).start(() => {
          setIsCompleted(true);
          onComplete();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.track}>
        <Text style={styles.prompt}>{label}</Text>
        <Animated.View 
          style={[
            styles.fill, 
            { width: Animated.add(translateX, BUTTON_WIDTH) }
          ]} 
        />
        <Animated.View 
          style={[
            styles.thumb, 
            { transform: [{ translateX }] }
          ]} 
          {...panResponder.panHandlers}
        >
          <Text style={styles.thumbIcon}>🚛</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: scale(25),
    marginVertical: scale(20),
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: scale(60),
    backgroundColor: '#F0F0F0',
    borderRadius: scale(30),
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  prompt: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#999',
    zIndex: 1,
  },
  fill: {
    height: '100%',
    backgroundColor: '#CA2027',
    borderRadius: scale(30),
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: BUTTON_WIDTH,
    height: BUTTON_WIDTH - scale(4),
    backgroundColor: 'white',
    borderRadius: BUTTON_WIDTH / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(2),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 2,
  },
  thumbIcon: {
    fontSize: moderateScale(22),
  },
});

export default SlideToAction;
