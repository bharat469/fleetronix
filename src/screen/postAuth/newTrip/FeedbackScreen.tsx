import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { getFontFamily } from '../../../helpers/fonts';
import { COLORS } from '../../../helpers/values/colors';

const REASONS = [
  'The pick-up or drop-off location may be too far',
  'The offered pay may not meet the driver\'s expectations',
  'The requested job may conflict with the driver\'s schedule',
  'The driver\'s vehicle may not be suitable for the type of job',
  'The driver may perceive safety issues related to the pick-up',
  'If the driver\'s vehicle is undergoing maintenance',
];

const FeedbackScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.feedbackCard}>
          <Text style={styles.cardTitle}>Feedback</Text>
          
          <View style={styles.reasonsContainer}>
            {REASONS.map((reason, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.reasonItem,
                  selectedReasons.includes(reason) && styles.selectedReason
                ]} 
                onPress={() => toggleReason(reason)}
              >
                <Text style={[
                  styles.reasonText,
                  selectedReasons.includes(reason) && styles.selectedReasonText
                ]}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Add your comments..."
            placeholderTextColor="#9E9E9E"
            multiline
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.cancelBtnText}>Cancle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  feedbackCard: {
    backgroundColor: '#CA2027',
    borderRadius: scale(15),
    padding: scale(20),
    marginTop: verticalScale(20),
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
    marginBottom: verticalScale(20),
  },
  reasonsContainer: {
    gap: verticalScale(10),
  },
  reasonItem: {
    backgroundColor: 'white',
    borderRadius: scale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedReason: {
    borderColor: '#1E1B4B',
    backgroundColor: '#F3F4F6',
  },
  reasonText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#374151',
  },
  selectedReasonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  commentInput: {
    backgroundColor: 'white',
    borderRadius: scale(8),
    padding: scale(15),
    height: verticalScale(100),
    marginTop: verticalScale(20),
    textAlignVertical: 'top',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(30),
    gap: scale(15),
  },
  cancelBtn: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#CA2027',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CA2027', // Matching SS color
  },
  cancelBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  submitBtn: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: scale(8),
    backgroundColor: '#CA2027',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
});

export default FeedbackScreen;
