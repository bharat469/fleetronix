import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon, SearchIcon, LocationIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SvgIcon from '../../../helpers/svgComponents';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useDriverInfo } from '../../../hooks/useAuth';
import Geolocation from 'react-native-geolocation-service';
import { useQuery } from '@tanstack/react-query';
import { getStates, getCities, StateData, CityData } from '../../../api/masterApi';
import { getFontFamily } from '../../../helpers/fonts';

const TargetIcon = () => (
  <View style={{ width: scale(20), height: scale(20), borderRadius: scale(10), borderWidth: 2, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: COLORS.primary }} />
    <View style={{ position: 'absolute', width: 2, height: scale(20), backgroundColor: COLORS.primary }} />
    <View style={{ position: 'absolute', width: scale(20), height: 2, backgroundColor: COLORS.primary }} />
  </View>
);

const NewTripLocationScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData, isLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  const [selectedAddress, setSelectedAddress] = useState(true);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
  });

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  });

  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const filteredStates = useMemo(() => {
    if (!statesData?.data) return [];
    if (!state.trim()) return statesData.data;
    return statesData.data.filter((s) =>
      s.name.toLowerCase().includes(state.toLowerCase())
    );
  }, [statesData, state]);

  const filteredCities = useMemo(() => {
    if (!citiesData?.data) return [];
    let list = citiesData.data;
    if (selectedState) {
      list = list.filter((c) => String(c.state_id) === String(selectedState.id));
    }
    if (!city.trim()) return list;
    return list.filter((c) =>
      c.name.toLowerCase().includes(city.toLowerCase())
    );
  }, [citiesData, selectedState, city]);

  const handleSelectState = (selectedStateItem: StateData) => {
    setState(selectedStateItem.name);
    setSelectedState(selectedStateItem);
    setCity('');
    setShowStateSuggestions(false);
  };

  const handleSelectCity = (selectedCity: CityData) => {
    setCity(selectedCity.name);
    setShowCitySuggestions(false);
  };

  const handleCloseSuggestions = () => {
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return false;
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please allow location permission to use this feature.');
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Detected Location:', position);
          Alert.alert('Location Detected', `Lat: ${position.coords.latitude}\nLon: ${position.coords.longitude}`);
        },
        (error) => {
          Alert.alert('Location Error', error.message || 'Could not get your location.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); handleCloseSuggestions(); }}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>New Trip Location</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: keyboardVisible ? verticalScale(220) : verticalScale(40) }
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.topSection}>
                <View style={styles.titleContainer}>
                  <Text style={styles.mainTitle}>Find Location to Ride</Text>
                  <View style={styles.svgWrapper}>
                    <SvgIcon
                      name='newTrip'
                      width={scale(180)}
                      height={verticalScale(117)}
                    />
                  </View>
                </View>
                <Text style={styles.subtitle}>Select preferred location and we'll show you nearby jobs.</Text>
              </View>

              {/* Address Card */}
              <TouchableOpacity
                style={[styles.addressCard, selectedAddress && styles.addressCardSelected, !driver?.address && { opacity: 0.6 }]}
                onPress={() => driver?.address && setSelectedAddress(!selectedAddress)}
                activeOpacity={0.9}
                disabled={!driver?.address}
              >
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Address</Text>
                  <Text style={styles.addressText}>
                    {driver?.address || (isLoading ? 'Loading address...' : 'No address added in profile')}
                  </Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedAddress && driver?.address && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity 
                style={styles.autoDetectBtn} 
                activeOpacity={0.8}
                onPress={getCurrentLocation}
              >
                <TargetIcon />
                <Text style={styles.autoDetectText}>Auto detect my location</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Add your Choice Address/Location</Text>
                <Text style={styles.formSubtitle}>
                  Enter your preferred truck driving location to personalize recommendations for the best driving experiences.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pick Your State*</Text>
                  <View style={styles.inputWrapper}>
                    <SearchIcon color="#CA2027" width={20} height={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your Preffered State"
                      value={state}
                      onChangeText={(text) => {
                        setState(text);
                        const matched = statesData?.data?.find(
                          (s) => s.name.trim().toLowerCase() === text.trim().toLowerCase()
                        );
                        setSelectedState(matched || null);
                        setShowStateSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowStateSuggestions(true);
                        setShowCitySuggestions(false);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: verticalScale(280), animated: true });
                        }, 100);
                      }}
                      placeholderTextColor="#999"
                    />
                    {state.length > 0 && (
                      <TouchableOpacity onPress={() => { setState(''); setSelectedState(null); setCity(''); }}>
                        <Text style={{ fontSize: moderateScale(18), color: '#888', marginRight: scale(5) }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showStateSuggestions && (
                    <View style={styles.suggestionsContainer}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} style={{ maxHeight: verticalScale(160) }}>
                        {filteredStates.length > 0 ? (
                          filteredStates.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.suggestionItem}
                              onPress={() => handleSelectState(item)}
                            >
                              <Text style={styles.suggestionText}>{item.name}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noSuggestionsText}>No matching states found</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pick State Cities*</Text>
                  <View style={styles.inputWrapper}>
                    <SearchIcon color="#CA2027" width={20} height={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your Preffered State Cities"
                      value={city}
                      onChangeText={(text) => {
                        setCity(text);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => {
                        setShowCitySuggestions(true);
                        setShowStateSuggestions(false);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                      placeholderTextColor="#999"
                    />
                    {city.length > 0 && (
                      <TouchableOpacity onPress={() => setCity('')}>
                        <Text style={{ fontSize: moderateScale(18), color: '#888', marginRight: scale(5) }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showCitySuggestions && (
                    <View style={styles.suggestionsContainer}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} style={{ maxHeight: verticalScale(160) }}>
                        {filteredCities.length > 0 ? (
                          filteredCities.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.suggestionItem}
                              onPress={() => handleSelectCity(item)}
                            >
                              <Text style={styles.suggestionText}>{item.name}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noSuggestionsText}>No matching cities found</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('NewTripDate')}
                >
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    padding: scale(5),
    marginRight: scale(10),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  topSection: {
    marginTop: verticalScale(10),
  },
  titleContainer: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontWeight: '500',
    color: COLORS.textColor.color5,
    width: SCREEN.WIDTH / 2.2

  },
  svgWrapper: {


  },
  subtitle: {
    fontSize: moderateScale(15),
    color: COLORS.textColor.color2.one,
    letterSpacing: 0.1,
    lineHeight: verticalScale(18),
  },
  addressCard: {
    backgroundColor: '#FFE5E5',
    borderRadius: scale(15),
    padding: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(25),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#333',
    marginBottom: verticalScale(4),
  },
  addressText: {
    fontSize: moderateScale(12),
    color: '#555',
    lineHeight: verticalScale(18),
  },
  radioButton: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
  },
  radioInner: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: COLORS.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: scale(10),
    fontSize: moderateScale(14),
    color: '#888',
  },
  autoDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(12),
    height: verticalScale(55),
    gap: scale(10),
  },
  autoDetectText: {
    fontSize: moderateScale(16),
    color: COLORS.textColor.color5,
    fontWeight: '600',
  },
  formSection: {
    marginTop: verticalScale(10),
  },
  formTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: COLORS.textColor.color5,
  },
  formSubtitle: {
    fontSize: moderateScale(12),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(8),
    lineHeight: verticalScale(18),
  },
  inputGroup: {
    marginTop: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFBABA',
    borderRadius: scale(30),
    height: verticalScale(50),
    paddingHorizontal: scale(20),
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    marginLeft: scale(10),
    fontSize: moderateScale(14),
    color: '#333',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(12),
    height: verticalScale(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(30),
  },
  submitText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(10),
    maxHeight: verticalScale(160),
    marginTop: verticalScale(5),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  suggestionItem: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  suggestionText: {
    fontSize: moderateScale(14),
    color: '#333',
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
  },
  noSuggestionsText: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    fontSize: moderateScale(14),
    color: '#888',
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    textAlign: 'center',
  },
});

export default NewTripLocationScreen;
