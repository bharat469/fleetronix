/**
 * DriverMarker.tsx
 *
 * Animated truck marker. Smoothly interpolates between GPS coordinates
 * using Marker.Animated from react-native-maps.
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import { Coordinate } from '../services/liveTrackingService';

interface DriverMarkerProps {
  coordinate: Coordinate;
  animationDuration?: number;
}

const TruckIcon: React.FC = () => (
  <Svg width={50} height={50} viewBox="0 0 50 50">
    {/* Drop shadow */}
    <Ellipse cx={25} cy={46} rx={13} ry={3} fill="rgba(0,0,0,0.15)" />
    {/* Cargo body */}
    <Rect x={3} y={14} width={30} height={22} rx={4} fill="#CC2B2B" />
    {/* Cab */}
    <Path d="M33 22 L33 36 L47 36 L47 28 L40 22 Z" fill="#CC2B2B" />
    {/* Windshield */}
    <Path d="M34 23 L34 28 L46 28 L46 27 L40 23 Z" fill="#B3E5FC" opacity={0.85} />
    {/* Cargo door line */}
    <Rect x={5} y={20} width={26} height={1.5} rx={1} fill="rgba(255,255,255,0.25)" />
    <Rect x={5} y={25} width={26} height={1.5} rx={1} fill="rgba(255,255,255,0.25)" />
    {/* Wheels */}
    <Circle cx={11} cy={38} r={5} fill="#222" />
    <Circle cx={11} cy={38} r={2.5} fill="#555" />
    <Circle cx={26} cy={38} r={5} fill="#222" />
    <Circle cx={26} cy={38} r={2.5} fill="#555" />
    <Circle cx={40} cy={38} r={5} fill="#222" />
    <Circle cx={40} cy={38} r={2.5} fill="#555" />
    {/* Headlight */}
    <Rect x={44} y={30} width={3} height={2.5} rx={1} fill="#FFD600" />
    {/* Tail light */}
    <Rect x={3} y={24} width={2} height={5} rx={1} fill="#FF4444" />
  </Svg>
);

const DriverMarker: React.FC<DriverMarkerProps> = ({
  coordinate,
  animationDuration = 1800,
}) => {
  const animLat = useRef(new Animated.Value(coordinate.latitude)).current;
  const animLng = useRef(new Animated.Value(coordinate.longitude)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animLat, {
        toValue: coordinate.latitude,
        duration: animationDuration,
        useNativeDriver: false,
      }),
      Animated.timing(animLng, {
        toValue: coordinate.longitude,
        duration: animationDuration,
        useNativeDriver: false,
      }),
    ]).start();
  }, [coordinate.latitude, coordinate.longitude]);

  return (
    <Marker.Animated
      coordinate={{
        latitude: animLat as any,
        longitude: animLng as any,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      tracksViewChanges={false}
    >
      <TruckIcon />
    </Marker.Animated>
  );
};

export default DriverMarker;
