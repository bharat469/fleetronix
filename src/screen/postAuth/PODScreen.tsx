import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { BackArrowIcon, ShieldCheckIcon, DocumentIcon } from '../../assets/svgIcons';
import { useTrips } from '../../hooks/useTrips';
import { Trip } from '../../types/trip';
import { resolveImageUrl } from '../../helpers/urlHelper';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useMutation } from '@tanstack/react-query';
import { reuploadPod } from '../../services/tripApi';
import { useImageSelection } from '../../helpers/useImageSelection';
import BottomSheetComponent from '../../components/bottomsheet';
import { COLORS } from '../../helpers/values/colors';
import SvgIcon from '../../helpers/svgComponents';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const defaultPodImage = require('../../assets/images/delivery_receipt_pod.jpg');

interface PODTrip {
  trip_id: string;
  load_id?: string;
  load_number: string;
  pod_recipient_name: string;
  delivered_at: string;
  confirmation_number: string;
  source_address: string;
  destination_address: string;
  status: string;
  trip_cost?: string | number;
  assigned_at?: string;
  task?: string;
  driver_name?: string;
  driver_photo_url?: string;
  document_url?: string;
  pod_status?: string;
  pod_rejection_remark?: string | null;
  rawTrip?: Trip;
  trip_number?: string;
  pod_can_reupload?: boolean;
}

const stubCompletedTrips: PODTrip[] = [
  {
    trip_id: '3024302349r5043253',
    load_number: '1238504594302593',
    pod_recipient_name: "Shipper's User",
    delivered_at: '12/11/2026 | 5:56 PM',
    confirmation_number: '123456789000',
    source_address: '12/24 Carol Bagh, New Delhi',
    destination_address: 'Church street, Narol, Mumbai',
    status: 'completed',
    trip_cost: '45000',
    assigned_at: '2026-11-10T10:00:00Z',
    task: 'General Delivery',
    driver_name: 'Ajay',
    driver_photo_url: 'https://randomuser.me/api/portraits/men/32.jpg'
  }
];

const resolvePodDocument = (trip: any) => {
  const docs = trip.pod_documents;
  if (!docs) return null;
  
  let path = '';
  if (Array.isArray(docs) && docs.length > 0) {
    const firstDoc = docs[0];
    if (typeof firstDoc === 'string') {
      path = firstDoc;
    } else if (typeof firstDoc === 'object') {
      path = firstDoc.path || firstDoc.url || firstDoc.uri || firstDoc.attachment_url || '';
    }
  } else if (typeof docs === 'string') {
    path = docs;
  }
  
  if (!path) return null;
  return resolveImageUrl(path);
};

const formatDeliveryDate = (trip: any) => {
  const rawDate = trip.pod_delivery_date || trip.delivery_date || trip.delivered_at || trip.completed_at || trip.updated_at || trip.estimated_delivery;
  const rawTime = trip.pod_delivery_time || trip.delivery_time || trip.estimated_delivery_time;
  
  if (!rawDate) return 'N/A';
  
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      let formattedTime = '';
      if (rawTime) {
        if (rawTime.includes(':')) {
          const parts = rawTime.split(':');
          let hours = parseInt(parts[0], 10);
          const minutes = parts[1].slice(0, 2);
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          formattedTime = `${hours}:${minutes} ${ampm}`;
        } else {
          formattedTime = rawTime;
        }
      } else {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        formattedTime = `${hours}:${minutes} ${ampm}`;
      }
      
      return `${formattedDate} | ${formattedTime}`;
    }
  } catch (e) {
    // Ignore and fallback
  }

  if (rawTime) {
    return `${rawDate} | ${rawTime}`;
  }
  return String(rawDate);
};

const PODScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Redux state
  const token = useSelector((state: RootState) => state.auth.accessToken);

  // State to track which trip we are reuploading for
  const [activeReuploadTrip, setActiveReuploadTrip] = useState<PODTrip | null>(null);

  // Fetch completed trips from API
  const { data: apiData, isLoading: isLoadingCompleted, refetch: refetchCompleted, isRefetching: isRefetchingCompleted } = useTrips('completed', 50);

  // Fetch ongoing trips to extract client-side completed ones
  const { data: ongoingData, isLoading: isLoadingOngoing, refetch: refetchOngoing, isRefetching: isRefetchingOngoing } = useTrips('ongoing', 50);

  const isLoading = isLoadingCompleted || isLoadingOngoing;
  const isRefetching = isRefetchingCompleted || isRefetchingOngoing;

  const refetch = React.useCallback(() => {
    refetchCompleted();
    refetchOngoing();
  }, [refetchCompleted, refetchOngoing]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Mutation for re-uploading POD
  const mutation = useMutation({
    mutationFn: reuploadPod,
    onSuccess: () => {
      Alert.alert('Success', 'POD re-uploaded successfully!');
      refetch();
      setActiveReuploadTrip(null);
    },
    onError: (error: Error) => {
      Alert.alert('Re-upload Failed', error.message ?? 'Please try again.');
      setActiveReuploadTrip(null);
    },
  });

  // Image Selection Hook
  const { isPickerVisible, setIsPickerVisible, pickImage, takePhoto } = useImageSelection(async (asset: any) => {
    if (!activeReuploadTrip) return;

    const raw = activeReuploadTrip.rawTrip;
    const recipientName = raw?.pod_recipient_name || raw?.driver_name || activeReuploadTrip.pod_recipient_name;
    const deliveryDate = raw?.pod_delivery_date || (raw?.assigned_at ? raw.assigned_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    const deliveryTime = raw?.pod_delivery_time || (raw?.assigned_at ? raw.assigned_at.split('T')[1].slice(0, 5) : new Date().toTimeString().slice(0, 5));
    const confirmationNumber = raw?.pod_confirmation_number || activeReuploadTrip.confirmation_number;
    const remark = raw?.pod_rejection_remark || 'Re-uploaded POD due to rejection';

    mutation.mutate({
      tripId: activeReuploadTrip.trip_id,
      recipientName,
      deliveryDate,
      deliveryTime,
      confirmationNumber,
      remark,
      documents: [{
        uri: asset.uri,
        name: asset.fileName ?? `pod_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      }],
      token: token ?? '',
    });
  });

  const handleReuploadPress = (trip: PODTrip) => {
    setActiveReuploadTrip(trip);
    setIsPickerVisible(true);
  };

  // Parse API data
  const apiCompletedTrips: Trip[] = apiData?.pages?.flatMap(page => page?.data || []) || [];
  const apiOngoingTrips: Trip[] = ongoingData?.pages?.flatMap(page => page?.data || []) || [];

  // Find ongoing trips that are completed client-side (both codes verified)
  const clientCompletedTrips = apiOngoingTrips.filter(trip => {
    const isPickupVerified =
      trip.pickup_code_verified === true ||
      (trip.pickup_code_verified as any) === 1 ||
      String(trip.pickup_code_verified) === 'true';
    const isDeliveryVerified =
      trip.delivery_code_verified === true ||
      (trip.delivery_code_verified as any) === 1 ||
      String(trip.delivery_code_verified) === 'true';
    return isPickupVerified && isDeliveryVerified;
  });

  // Merge ongoing client-side completed trips with the API completed list, avoiding duplicates
  const mainTripIds = new Set(apiCompletedTrips.map(t => t.trip_id || t.id));
  const uniqueClientCompleted = clientCompletedTrips.filter(t => !mainTripIds.has(t.trip_id || t.id));

  const apiTrips: Trip[] = [...uniqueClientCompleted, ...apiCompletedTrips];
  
  // Format API trips to conform to POD fields
  const completedTrips: PODTrip[] = apiTrips.map(trip => ({
    trip_id: trip.trip_id || trip.id || 'N/A',
    load_id: trip.load_id || 'N/A',
    load_number: trip.load_number || trip.load_id || 'N/A',
    pod_recipient_name: trip.pod_recipient_name || trip.driver_name || trip.customer_name || "Shipper's User",
    delivered_at: formatDeliveryDate(trip),
    confirmation_number: trip.pod_confirmation_number || trip.trip_number || '123456789000',
    source_address: trip.source_address || `${trip.pickup_city || 'New Delhi'}`,
    destination_address: trip.destination_address || `${trip.drop_city || 'Mumbai'}`,
    status: trip.status,
    trip_cost: trip.trip_cost || trip.price,
    assigned_at: trip.assigned_at,
    task: trip.task || trip.truck_type,
    driver_name: trip.driver_name,
    driver_photo_url: trip.driver_photo_url,
    document_url: resolvePodDocument(trip) || (trip.image ? resolveImageUrl(trip.image) : undefined),
    pod_status: trip.pod_status,
    pod_rejection_remark: trip.pod_rejection_remark,
    rawTrip: trip,
    trip_number: trip.trip_number || 'N/A',
    pod_can_reupload: !!trip.pod_can_reupload
  }));

  const openDocumentViewer = (imageSource: any) => {
    setSelectedImage(imageSource);
    setViewerVisible(true);
  };

  const handleCardPress = (trip: PODTrip) => {
    // Map PODTrip fields back to standard Trip format for Details Screen
    const tripData = {
      trip_id: trip.trip_id,
      load_id: trip.load_id,
      load_number: trip.load_number,
      customer_name: trip.pod_recipient_name,
      status: trip.status,
      source_address: trip.source_address,
      destination_address: trip.destination_address,
      trip_cost: trip.trip_cost,
      assigned_at: trip.assigned_at || '',
      task: trip.task || '',
      driver_name: trip.driver_name || '',
      driver_photo_url: trip.driver_photo_url || ''
    };

    navigation.navigate('TripDetails', {
      tripId: trip.trip_id,
      loadNumber: trip.load_number,
      tripData: tripData as any
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header aligned with other pages */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proof of Delivery (POD)</Text>
        </View>
      </View>

      {isLoading && apiTrips.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#CA2027" />
        </View>
      ) : completedTrips.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollContentEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#CA2027']}
              tintColor="#CA2027"
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed trips found.</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#CA2027']}
              tintColor="#CA2027"
            />
          }
        >
          {completedTrips.map((trip, index) => {
            return (
              <TouchableOpacity 
                key={trip.trip_id + index}
                style={styles.card}
                onPress={() => handleCardPress(trip)}
                activeOpacity={0.95}
              >
                {/* Pink top section */}
                <View style={styles.cardTop}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.loadIdText}>Load ID {trip.load_number}</Text>
                    {!trip.pod_status || trip.pod_status === 'approved' || trip.pod_status === 'completed' ? (
                      <View style={styles.statusBadgeRow}>
                        <Text style={[styles.statusText, { color: '#10B981' }]}>
                          {trip.pod_status === 'completed' ? 'Completed' : 'Approved'}
                        </Text>
                        <View style={[styles.verifiedBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.checkMark}>✓</Text>
                        </View>
                      </View>
                    ) : trip.pod_status === 'rejected' ? (
                      <View style={styles.statusBadgeRow}>
                        <Text style={[styles.statusText, { color: '#CA2027' }]}>Rejected</Text>
                        <View style={[styles.verifiedBadge, { backgroundColor: '#CA2027' }]}>
                          <Text style={styles.checkMark}>✕</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.statusBadgeRow}>
                        <Text style={[styles.statusText, { color: '#CA2027' }]}>Pending</Text>
                        <View style={[styles.verifiedBadge, { backgroundColor: '#CA2027' }]}>
                          <Text style={styles.checkMark}>✕</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Detail Rows */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Recipient's Name</Text>
                    <Text style={styles.detailValue}>{trip.pod_recipient_name || "No Recipient"}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivered At</Text>
                    <Text style={styles.detailValue}>{trip.delivered_at}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Confirmation Number</Text>
                    <Text style={styles.detailValue}>{trip.confirmation_number}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Started</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{trip.source_address}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>End</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{trip.destination_address}</Text>
                  </View>

                  <View style={[styles.detailRow, { alignItems: 'center', marginTop: verticalScale(10) }]}>
                    <Text style={styles.detailLabel}>Documents Uploaded</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(10) }}>
                      {trip.document_url ? (
                        <TouchableOpacity
                          onPress={() => openDocumentViewer({ uri: trip.document_url })}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: trip.document_url }} style={styles.docThumbnail} />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.noDocPlaceholder}>
                          <DocumentIcon color="#8E8E93" width={18} height={18} />
                          <Text style={styles.noDocText}>No Doc</Text>
                        </View>
                      )}

                      {trip.pod_can_reupload && (
                        <TouchableOpacity 
                          style={styles.reuploadBtn}
                          onPress={() => handleReuploadPress(trip)}
                        >
                          <Text style={styles.reuploadBtnText}>Re-upload ↻</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Thin Line divider */}
                <View style={styles.divider} />

                {/* Bottom section showing Trip ID */}
                <View style={styles.cardBottom}>
                  <Text style={styles.tripIdText}>Trip ID {trip.trip_number}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Full Screen Document Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseOverlayBtn}
            onPress={() => setViewerVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setViewerVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image 
                source={selectedImage} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />
            )}
          </View>
        </View>
      </Modal>
      {/* Image Picker Bottom Sheet */}
      <BottomSheetComponent
        isVisible={isPickerVisible}
        onBackdropPress={() => setIsPickerVisible(false)}
        onBackButtonPress={() => setIsPickerVisible(false)}
      >
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Select Document Source</Text>
          <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
            <View style={styles.pickerIcon}>
              <SvgIcon name="phoneActions" width={22} height={22} color={COLORS.primary} />
            </View>
            <Text style={styles.pickerOptionText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
            <View style={styles.pickerIcon}>
              <SvgIcon name="uploadDocument" width={22} height={22} color={COLORS.primary} />
            </View>
            <Text style={styles.pickerOptionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setIsPickerVisible(false)}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetComponent>

      {/* Loading Overlay */}
      {mutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#CA2027" />
          <Text style={styles.loadingOverlayText}>Re-uploading POD...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(15),
    padding: scale(2),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1A57',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
  },
  card: {
    backgroundColor: '#FFF5F5',
    borderRadius: scale(20),
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFEBEB',
    overflow: 'hidden',
  },
  cardTop: {
    padding: scale(20),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  loadIdText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  verifiedBadge: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: 'white',
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    marginTop: -verticalScale(1),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(6),
  },
  detailLabel: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#4B5563',
    width: '40%',
  },
  detailValue: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#1F2937',
    width: '55%',
    textAlign: 'right',
  },
  docThumbnail: {
    width: scale(52),
    height: scale(36),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE3E3',
  },
  cardBottom: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
  },
  tripIdText: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseOverlayBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -verticalScale(40),
    right: 0,
    backgroundColor: '#CA2027',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
  },
  modalCloseText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#858080',
    textAlign: 'center',
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDocPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noDocText: {
    fontSize: moderateScale(11),
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: scale(6),
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  statusText: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  reuploadBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reuploadBtnText: {
    color: '#CA2027',
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  pickerSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    padding: scale(25),
    paddingBottom: verticalScale(40),
  },
  pickerTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  pickerOptionText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#333',
  },
  pickerCancel: {
    marginTop: verticalScale(15),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#CA2027',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    marginTop: verticalScale(10),
  },
});

export default PODScreen;
