import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SvgIcon from '../../../helpers/svgComponents';

const NegotiationZoneScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('AllLoads');
    }, 3000); // 3 seconds simulation

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.content}>
        <View style={styles.svgWrapper}>
          <SvgIcon 
            name="waiting" 
            width={scale(180)} 
            height={scale(180)} 
          />
        </View>
        
        <Text style={styles.waitingTitle}>Waiting</Text>
        
        <Text style={styles.description}>
          Enter the Negotiation Zone, where clients and users discuss and settle bills collaboratively. Efficient, secure, and confidential negotiations await. Join now for fair agreements.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(40),
    marginTop: -verticalScale(50),
  },
  svgWrapper: {
    marginBottom: verticalScale(40),
    // Added for better centering
  },
  waitingTitle: {
    fontSize: moderateScale(40),
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: verticalScale(20),
  },
  description: {
    fontSize: moderateScale(16),
    color: '#333',
    textAlign: 'center',
    lineHeight: verticalScale(24),
    fontWeight: '500',
  },
});

export default NegotiationZoneScreen;
