import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { getFontFamily } from '../../../helpers/fonts';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { postFeedback } from '../../../services/tripApi';
import { resetTrip, setTripId } from '../../../redux/slices/tripSlice';
import { ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

const RatingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Rating'>>();
  const dispatch = useDispatch();
  const tripRedux  = useSelector((state: RootState) => state.trip);
  const token      = useSelector((state: RootState) => state.auth.accessToken);

  const { trip } = route.params;
  const tripId = tripRedux.tripId || trip?.trip_id || trip?.id;

  useEffect(() => {
    if (tripId && !tripRedux.tripId) {
      dispatch(setTripId(tripId));
    }
  }, [tripId, tripRedux.tripId, dispatch]);



  const [rating, setRating] = useState(0);

  const { mutate, isPending } = useMutation({
    mutationFn: postFeedback,
    onSuccess: () => {
      dispatch(resetTrip());
      navigation.navigate('Congratulations', { trip });
    },
    onError: (error: Error) => {
      Alert.alert('Feedback Failed', error.message ?? 'Something went wrong.');
    },
  });

  const handleSubmit = () => {
    if (isPending) return;
    mutate({
      tripId,
      rating,
      token,
      comment: rating >= 4 ? 'Great delivery experience' : 'Average experience'
    });
  };

  if (!tripId || !trip) {
    console.warn('[RatingScreen] No tripId found in Redux or props');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF2F2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rating</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.feedbackCard}>
          <View style={styles.profileSection}>
            <Image 
              source={{ uri: trip?.driver_photo_url || trip?.image || 'https://randomuser.me/api/portraits/men/1.jpg' }} 
              style={styles.profilePic} 
            />
            <Text style={styles.userName}>{trip?.driver_name || 'Driver'}</Text>
            <Text style={styles.userTier}>2nd Tier</Text>
          </View>

          <Text style={styles.question}>How is your trip?</Text>
          <Text style={styles.subQuestion}>Your feedback will help improve driving experience</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, { color: star <= rating ? '#CA2027' : '#E0E0E0' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, (isPending || rating === 0) && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={isPending || rating === 0}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: scale(40),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(25),
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: scale(30),
    padding: scale(25),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: verticalScale(-60),
    marginBottom: verticalScale(20),
  },
  profilePic: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    borderWidth: 5,
    borderColor: 'white',
  },
  userName: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#333',
    marginTop: verticalScale(10),
  },
  userTier: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#858080',
  },
  question: {
    fontSize: moderateScale(24),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1A57',
    marginTop: verticalScale(10),
  },
  subQuestion: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#858080',
    textAlign: 'center',
    marginTop: verticalScale(10),
    paddingHorizontal: scale(10),
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: verticalScale(25),
    gap: scale(10),
  },
  star: {
    fontSize: moderateScale(40),
  },
  submitBtn: {
    width: '100%',
    height: verticalScale(55),
    backgroundColor: '#CA2027',
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
});

export default RatingScreen;
