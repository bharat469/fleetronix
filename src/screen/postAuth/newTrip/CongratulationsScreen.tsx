import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { getFontFamily } from '../../../helpers/fonts';
import SvgIcon from '../../../helpers/svgComponents';
import { SafeAreaView } from 'react-native-safe-area-context';

const CongratulationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Congratulations'>>();
  const { trip } = route.params;

  useEffect(() => {
    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Feedback', { trip });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation, trip]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgIcon name="congratulations" width={scale(100)} height={scale(100)} color="#CA2027" />
        </View>

        <Text style={styles.title}>Congratulations</Text>
        <Text style={styles.description}>
          Congratulations on a successful delivery! Celebrate your achievement and anticipate more success ahead!
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: scale(30),
  },
  iconContainer: {
    marginBottom: verticalScale(30),
  },
  popperIcon: {
    fontSize: moderateScale(100),
  },
  title: {
    fontSize: moderateScale(32),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#CA2027',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  description: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: verticalScale(24),
  },
});

export default CongratulationsScreen;
