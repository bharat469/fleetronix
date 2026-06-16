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
  ProfilePic: undefined;
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
  KYC: { fromAccount?: boolean } | undefined;
  Status: undefined;
  NewTripLocation: undefined;
  NewTripDate: undefined;
  NewTripPreferences: undefined;
  SearchingTruck: undefined;
  NegotiationZone: undefined;
  AllLoads: { initialTab?: 'all' | 'ongoing' | 'assigned' | 'completed' } | undefined;

  AvailableJobs: undefined;
  TripDetails: { tripId: string; loadNumber: string; tripData?: Trip };
  LiveTracking: { trip: any };
  StartTrip: { trip: any };
  VerifyDeliveryOtp: { trip: any };
  Delivery: { trip: any };
  ConfirmDelivery: { trip: any };
  Rating: { trip: any };
  Congratulations: { trip: any };
  Feedback: { trip: any };
  ExpenseDashboard: undefined;
  AddExpense: undefined;
  ExpenseSuccess: { expenseId: string };
  AllExpenses: undefined;
  TransporterScreen: undefined;
  Support: undefined;
  POD: undefined;
};
