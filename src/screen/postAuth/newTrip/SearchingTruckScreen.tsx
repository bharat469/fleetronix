import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

const RadarCircle = ({ delay }: { delay: number }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 4,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, opacityAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.radarCircle,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const SearchingTruckScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('AvailableJobs');
    }, 4000); // 4 seconds of animation

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.topInfo}>
        <Text style={styles.title}>Searching Truck for Ride</Text>
        <Text style={styles.subtitle}>Hold on lets search for available Truck For your location</Text>
        <Image
          source={{ uri: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' }}
          style={styles.googleLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.waitText}>Wait..</Text>
        <Text style={styles.somethingText}>There is some thing for you</Text>

        <View style={styles.radarWrapper}>
          <RadarCircle delay={0} />
          <RadarCircle delay={600} />
          <RadarCircle delay={1200} />
          <View style={styles.centerDot}>
            <View style={styles.innerDot} />
          </View>
        </View>
      </View>

      <View style={styles.bottomTrucks}>
        <Image
          source={require('../../../assets/images/truckSearch.png')}
          style={styles.truckFleet}
          resizeMode='cover'
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topInfo: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#000',
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: '#888',
    marginTop: verticalScale(5),
    width: '80%',
  },
  googleLogo: {
    width: scale(60),
    height: verticalScale(20),
    marginTop: verticalScale(15),
    alignSelf: 'flex-start',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -verticalScale(50),
  },
  waitText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#333',
  },
  somethingText: {
    fontSize: moderateScale(18),
    color: '#888',
    marginTop: verticalScale(5),
    marginBottom: verticalScale(80),
  },
  radarWrapper: {
    width: scale(100),
    height: scale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle: {
    position: 'absolute',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 127, 80, 0.3)', // Coral/Orange color
  },
  centerDot: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    borderWidth: 5,
    borderColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 10,
  },
  innerDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FF7F50',
  },
  bottomTrucks: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: verticalScale(150),
  },
  truckFleet: {
    width: '100%',
    height: '100%',

  },
});

export default SearchingTruckScreen;
