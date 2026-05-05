declare module 'react-native-slider' {
  import { Component } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface SliderProps {
    value?: number;
    disabled?: boolean;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    thumbStyle?: StyleProp<ViewStyle>;
    trackStyle?: StyleProp<ViewStyle>;
    onValueChange?: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    style?: StyleProp<ViewStyle>;
    animateTransitions?: boolean;
    animationConfig?: any;
    animationType?: 'spring' | 'timing';
    debugTouchArea?: boolean;
  }

  export default class Slider extends Component<SliderProps> {}
}
