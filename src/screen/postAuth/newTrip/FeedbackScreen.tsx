import React, { useState, useEffect } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { getFontFamily } from '../../../helpers/fonts';
import { COLORS } from '../../../helpers/values/colors';
import { useMutation } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../redux/store';
import { setTripId } from '../../../redux/slices/tripSlice';
import { postTripFeedback } from '../../../services/tripApi';
import { ActivityIndicator, Alert } from 'react-native';

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
  const route = useRoute<RouteProp<RootStackParamList, 'Feedback'>>();
  const tripRedux  = useSelector((state: RootState) => state.trip);
  const token      = useSelector((state: RootState) => state.auth.accessToken);
  const dispatch = useDispatch();

  const { trip } = route.params;
  const tripId = tripRedux.tripId || trip?.trip_id || trip?.id;

  useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);


  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postTripFeedback,
  });

  const handleSubmit = async () => {
    if (isPending || selectedReasons.length === 0) return;
    
    try {
      // Submit each reason as a separate call as per backend requirement
      await Promise.all(
        selectedReasons.map(reason => 
          mutateAsync({ tripId, reason, comment, token })
        )
      );
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Feedback Failed', error.message ?? 'Something went wrong.');
    }
  };

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  if (!tripId || !trip) {
    console.warn('[FeedbackScreen] No tripId found in Redux or props');
    return null;
  }

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
            {REASONS.map((reason, index) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.reasonItem,
                    isSelected && styles.selectedReason
                  ]} 
                  onPress={() => toggleReason(reason)}
                  activeOpacity={0.8}
                >
                  <View style={styles.reasonRow}>
                    <Text style={[
                      styles.reasonText,
                      isSelected && styles.selectedReasonText
                    ]}>{reason}</Text>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxActive
                    ]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
            style={[styles.submitBtn, (isPending || selectedReasons.length === 0) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isPending || selectedReasons.length === 0}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Submit</Text>
            )}
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
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedReason: {
    borderColor: '#1E1B4B',
    backgroundColor: '#FFEAEA',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#374151',
    marginRight: scale(10),
  },
  selectedReasonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#CA2027',
  },
  checkbox: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxActive: {
    borderColor: '#1E1B4B',
    backgroundColor: '#1E1B4B',
  },
  checkMark: {
    color: 'white',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
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
