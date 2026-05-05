import { Trip } from '../types/trip';

export type RootStackParamList = {
  Onboarding: undefined;
  LanguageSelection: undefined;
  Login: undefined;
  OTPVerify: { phoneNumber: string; purpose: string };
  LocationEnable: undefined;
  SelectTruck: undefined;
  SelectState: undefined;
  VerifyDocuments: undefined;
  ReadyToDrive: undefined;
  CallVerification: undefined;
  Home: undefined;
  AccountDetails: undefined;
  AddAddress: undefined;
  EnterAddress: { 
    initialAddress?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  KYC: undefined;
  Status: undefined;
  NewTripLocation: undefined;
  NewTripDate: undefined;
  NewTripPreferences: undefined;
  SearchingTruck: undefined;
  NegotiationZone: undefined;
  AllLoads: undefined;

  AvailableJobs: undefined;
  TripDetails: { tripId: string; loadNumber: string; tripData?: Trip };
  LiveTracking: { tripId?: string } | undefined;

  StartTrip: { trip: Trip };
  VerifyDeliveryOtp: { tripId: string };
  Delivery: { trip: Trip };
  ConfirmDelivery: { tripId: string };
  Rating: undefined;
  Congratulations: undefined;
  Feedback: undefined;
};
