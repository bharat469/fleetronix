import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Scale horizontally
export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
// Scale vertically
export const verticalScale = (size: number) =>
  (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// Moderate scale (more consistent across devices)
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Screen info
export const SCREEN = {
  WIDTH: SCREEN_WIDTH,
  HEIGHT: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH <= 360,
  isTablet: SCREEN_WIDTH >= 768,
};

export const pixelRatio = PixelRatio.get();