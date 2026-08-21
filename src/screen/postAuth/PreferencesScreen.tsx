import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import { BackArrowIcon, MoreDotsIcon, ShieldCheckIcon, EditPenIcon } from '../../assets/svgIcons';
import { useDriverInfo, useUpdateDriver } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { getStates, getVehicleTypes, StateData, VehicleType } from '../../api/masterApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resolveImageUrl } from '../../helpers/urlHelper';
import { AlertHelper } from '../../components/common/AlertPopup';
import SvgIcon from '../../helpers/svgComponents';
import { useTranslation } from 'react-i18next';

const PreferencesScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { userToken, driverId } = useSelector((state: RootState) => state.auth);

  const { data: driverData, isLoading: isDriverLoading } = useDriverInfo(driverId || '', userToken || '');
  const driver = driverData?.data;

  // Master Data Queries
  const { data: statesResponse } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
  });

  const { data: vehicleTypesResponse } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: getVehicleTypes,
  });

  const allStates = statesResponse?.data || [];
  const allTrucks = vehicleTypesResponse?.data || [];

  // Editing Mode & Local State
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedTrucks, setSelectedTrucks] = useState<VehicleType[]>([]);
  const [selectedStates, setSelectedStates] = useState<StateData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Modals visibility
  const [truckModalVisible, setTruckModalVisible] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);

  // Search query for state modal
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  // Update Driver Hook
  const { mutate: updateDriverProfile, isPending: isSaving } = useUpdateDriver({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverInfo', driverId] });
      AlertHelper.success(t('success', 'Success'), t('preferences_updated_success', 'Preferences updated successfully'));
      setIsEditing(false);
    },
    onError: (error: any) => {
      AlertHelper.error(t('error', 'Error'), error.message || t('preferences_update_failed', 'Failed to update preferences'));
    }
  });

  // Map API driver details to Local State
  const initialStates = useMemo(() => {
    if (!driver?.operating_states || allStates.length === 0) return [];
    if (Array.isArray(driver.operating_states)) {
      return driver.operating_states.map((s: any) => {
        const stateId = typeof s === 'string' ? s : s?.id;
        return allStates.find((as) => as.id === stateId || as.name === stateId);
      }).filter((s: any): s is StateData => !!s);
    }
    const stateNamesOrIds = String(driver.operating_states).split(',').map((s: string) => s.trim());
    return stateNamesOrIds.map((nameOrId: string) => {
      return allStates.find((as) => as.id === nameOrId || as.name === nameOrId);
    }).filter((s: any): s is StateData => !!s);
  }, [driver?.operating_states, allStates]);

  const initialTrucks = useMemo(() => {
    if (!driver?.vehicle_experienced || allTrucks.length === 0) return [];
    const truckIdsOrNames = typeof driver.vehicle_experienced === 'string'
      ? driver.vehicle_experienced.split(',').map((t: string) => t.trim())
      : Array.isArray(driver.vehicle_experienced)
        ? driver.vehicle_experienced.map((t: any) => typeof t === 'string' ? t : t?.id || t?.name)
        : [];
    return truckIdsOrNames.map((idOrName: string) => {
      return allTrucks.find((at) => at.id === idOrName || at.name === idOrName);
    }).filter((t: any): t is VehicleType => !!t);
  }, [driver?.vehicle_experienced, allTrucks]);

  useEffect(() => {
    if (driver && allStates.length > 0 && allTrucks.length > 0 && !isInitialized) {
      setSelectedStates(initialStates);
      setSelectedTrucks(initialTrucks);
      setIsInitialized(true);
    }
  }, [driver, allStates, allTrucks, initialStates, initialTrucks, isInitialized]);

  const removeState = (stateId: string) => {
    if (!isEditing) {
      AlertHelper.error(t('locked', 'Locked'), t('click_edit_instructions', 'Please click Edit from the menu top-right to edit'));
      return;
    }
    setSelectedStates(selectedStates.filter(s => s.id !== stateId));
  };

  const handleTruckToggle = (truck: VehicleType) => {
    if (selectedTrucks.some(t => t.id === truck.id)) {
      setSelectedTrucks(selectedTrucks.filter(t => t.id !== truck.id));
    } else {
      setSelectedTrucks([...selectedTrucks, truck]);
    }
  };

  const handleStateToggle = (state: StateData) => {
    if (selectedStates.some(s => s.id === state.id)) {
      setSelectedStates(selectedStates.filter(s => s.id !== state.id));
    } else {
      setSelectedStates([...selectedStates, state]);
    }
  };

  const handleSubmit = () => {
    if (!isEditing) return;

    const languageMap: Record<string, string> = {
      'en': 'english',
      'hi': 'hindi',
      'te': 'telugu',
      'kn': 'kannada',
      'bn': 'bengali',
      'mr': 'marathi'
    };
    const cleanCode = (i18n.language || 'en').split('-')[0].split('_')[0].toLowerCase();
    const backendLang = languageMap[cleanCode] || 'english';

    updateDriverProfile({
      driverId: driverId || '',
      token: userToken || '',
      data: {
        vehicle_experienced: selectedTrucks.map(t => t.id).join(','),
        operating_state_ids: selectedStates.map(s => s.id).join(','),
        is_active: driver?.is_active ?? true,
        language_preference: backendLang,
      }
    });
  };

  const filteredStatesList = useMemo(() => {
    if (!stateSearchQuery.trim()) return allStates;
    return allStates.filter(s =>
      s.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
    );
  }, [allStates, stateSearchQuery]);

  const selectedTrucksText = selectedTrucks.map(t => t.name).join(', ') || 'No trucks selected';

  if (isDriverLoading || !isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('preferences', 'Preferences')}</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Driver Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profilePicWrapper}>
            <Image
              source={{ uri: resolveImageUrl(driver?.photo_path) }}
              style={styles.profilePic as any}
            />
            <TouchableOpacity style={styles.editPicBtn} activeOpacity={0.8}>
              <EditPenIcon />
            </TouchableOpacity>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{driver?.full_name || driver?.first_name || 'Driver'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {driver?.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Available'}
              </Text>
            </View>
            <View style={styles.kycBadge}>
              <Text style={styles.kycText}>
                {driver?.kyc_status
                  ? `KYC ${driver.kyc_status.charAt(0).toUpperCase() + driver.kyc_status.slice(1)}`
                  : 'KYC Pending'}
              </Text>
            </View>
          </View>

          {/* Three Dots Menu */}
          <TouchableOpacity 
            style={styles.moreBtn} 
            activeOpacity={0.7}
            onPress={() => setShowMenu(!showMenu)}
          >
            <MoreDotsIcon color={COLORS.primary} />
          </TouchableOpacity>

          {showMenu && (
            <View style={styles.popoverMenu}>
              <TouchableOpacity 
                style={styles.menuOption} 
                onPress={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                  AlertHelper.success(t('editing_mode_title', 'Editing Mode'), t('editing_mode_desc', 'You can now edit Selected Trucks and Preferences State.'));
                }}
              >
                <Text style={styles.menuOptionText}>{t('edit', 'Edit')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected Trucks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('selected_trucks_label', 'Selected Trucks*')}</Text>
          <TouchableOpacity
            style={[styles.truckFieldContainer, isEditing && styles.editingBorder]}
            activeOpacity={isEditing ? 0.7 : 1}
            onPress={() => isEditing && setTruckModalVisible(true)}
          >
            <Text style={styles.truckText}>{selectedTrucksText}</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences State Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('preferences_state_label', 'Preferences State*')}</Text>
          <TouchableOpacity
            style={[styles.statesBox, isEditing && styles.editingBorder]}
            activeOpacity={isEditing ? 0.7 : 1}
            onPress={() => isEditing && setStateModalVisible(true)}
          >
            <View style={styles.chipsContainer}>
              {selectedStates.map(state => (
                <View key={state.id} style={styles.chip}>
                  <Text style={styles.chipText}>{state.name}</Text>
                  <TouchableOpacity 
                    onPress={() => removeState(state.id)} 
                    style={styles.chipClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.chipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {selectedStates.length === 0 && (
                <Text style={styles.placeholderText}>{t('no_states_selected', 'No states selected')}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      {isEditing && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.submitBtn} 
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <ShieldCheckIcon color="white" width={scale(20)} height={verticalScale(20)} />
                <Text style={styles.submitBtnText}>{t('submit', 'Submit')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Truck Selection Modal */}
      <Modal
        visible={truckModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTruckModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('select_trucks', 'Select Trucks')}</Text>
            <FlatList
              data={allTrucks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedTrucks.some(t => t.id === item.id);
                return (
                  <TouchableOpacity
                    style={styles.modalItemRow}
                    onPress={() => handleTruckToggle(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>
                      {item.name}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <SvgIcon name="checkIcon" width={scale(12)} height={scale(12)} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setTruckModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('done', 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* State Selection Modal */}
      <Modal
        visible={stateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('select_states', 'Select States')}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_your_state', 'Search state...')}
              value={stateSearchQuery}
              onChangeText={setStateSearchQuery}
              placeholderTextColor="#999"
            />
            <FlatList
              data={filteredStatesList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedStates.some(s => s.id === item.id);
                return (
                  <TouchableOpacity
                    style={styles.modalItemRow}
                    onPress={() => handleStateToggle(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>
                      {item.name}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <SvgIcon name="checkIcon" width={scale(12)} height={scale(12)} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setStateModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('done', 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: COLORS.textColor.color5,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(100),
  },
  profileCard: {
    flexDirection: 'row',
    paddingVertical: verticalScale(20),
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#F0F0F0',
  },
  editPicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userDetails: {
    marginLeft: scale(20),
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS.textColor.color5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  statusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: COLORS.greenColor.color1,
    marginRight: scale(8),
  },
  statusText: {
    fontSize: moderateScale(13),
    color: COLORS.textColor.color2.one,
    fontWeight: '500',
  },
  kycBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellowColor.color1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginTop: verticalScale(6),
  },
  kycText: {
    fontSize: moderateScale(11),
    color: COLORS.yellowColor.color2,
    fontWeight: '600',
  },
  moreBtn: {
    padding: scale(10),
    position: 'absolute',
    right: 0,
    top: verticalScale(10),
  },
  popoverMenu: {
    position: 'absolute',
    right: scale(10),
    top: verticalScale(45),
    backgroundColor: 'white',
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  menuOption: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  menuOptionText: {
    fontSize: moderateScale(14),
    color: COLORS.textColor.color3,
    fontWeight: '500',
  },
  section: {
    marginTop: verticalScale(25),
  },
  sectionLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.textColor.color3,
    marginBottom: verticalScale(10),
  },
  truckFieldContainer: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: scale(20),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(18),
    backgroundColor: 'white',
  },
  editingBorder: {
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  truckText: {
    fontSize: moderateScale(14),
    color: COLORS.primary,
    fontWeight: '500',
  },
  statesBox: {
    backgroundColor: 'rgba(202, 32, 39, 0.08)',
    borderRadius: scale(8),
    padding: scale(12),
    minHeight: verticalScale(100),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: scale(12),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(202, 32, 39, 0.15)',
  },
  chipText: {
    fontSize: moderateScale(13),
    color: '#333',
    marginRight: scale(6),
  },
  chipClose: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCloseText: {
    fontSize: moderateScale(12),
    color: '#666',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#999',
    fontSize: moderateScale(14),
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(8),
    paddingVertical: verticalScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(8),
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: scale(12),
    padding: scale(20),
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.textColor.color5,
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(15),
    color: '#333',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: moderateScale(15),
    color: '#333',
  },
  selectedModalItemText: {
    fontWeight: '500',
    color: COLORS.primary,
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(4),
    borderWidth: 1.5,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(8),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    marginTop: verticalScale(15),
  },
  modalCloseBtnText: {
    color: 'white',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
});

export default PreferencesScreen;
