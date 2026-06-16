import apiClient from '../api/apiClient';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Config from 'react-native-config';
import { store } from '../redux/store';
import { updateTokens } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper';
import axios from 'axios';

const BASE_URL = Config.API_BASE_URL;

export interface ExpenseDashboardParams {
  month: number;
  year: number;
  frequency: string;
}

export interface ExpenseDashboardResponse {
  success: boolean;
  data: {
    total_expense: number;
    received: number;
    pending: number;
    spend_frequency: {
      data_points: Array<{
        amount: number;
        label: string;
      }>;
      tab: string;
    };
    recent_transactions: Array<{
      id: string;
      category: string;
      description: string;
      amount: number;
      time: string;
      type: 'expense' | 'income';
      sign: 'plus' | 'minus';
    }>;
  };
}

export const fetchExpenseDashboard = async (params: ExpenseDashboardParams): Promise<ExpenseDashboardResponse> => {
  const { month, year, frequency } = params;
  const url = `expense/dashboard?month=${month}&year=${year}&frequency=${frequency}`;
  
  console.log(`[expenseApi] GET ${url}`);
  try {
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    console.error('[expenseApi] Dashboard fetch failed:', error?.message);
    throw error;
  }
};
export interface AddExpenseParams {
  amount: number;
  category: string;
  description: string;
  mode_of_payment: string;
  trip_id?: string | null;
  attachment?: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

export const addExpense = async (params: AddExpenseParams) => {
  const { amount, category, description, mode_of_payment, trip_id, attachment } = params;
  const state = store.getState();
  const token = state.auth.userToken;

  const url = `${BASE_URL}/expense/`;

  console.log('[addExpense] 📤 Request start (BlobUtil)');

  const categoryMap: { [key: string]: string } = {
    'Toll': 'toll',
    'Food': 'food',
    'Subscription': 'subscription',
    'Repairing': 'repairing',
    'Tire Changing': 'tire_changing',
    'Fuel': 'fuel',
    'Loading/unloading': 'loading_unloading',
    'Lodging': 'lodging',
    'Cleaning': 'cleaning',
    'Other': 'other',
    'Shopping': 'shopping'
  };

  const walletMap: { [key: string]: string } = {
    'UPI': 'upi',
    'Cash': 'cash',
    'bank transfer': 'bank_transfer',
    'wallet': 'wallet',
    'cheque': 'cheque'
  };

  const multipartBody: any[] = [];
  multipartBody.push({ name: 'amount', data: String(amount) });
  multipartBody.push({ name: 'category', data: categoryMap[category] || category.toLowerCase() });
  multipartBody.push({ name: 'description', data: description });
  multipartBody.push({ name: 'mode_of_payment', data: walletMap[mode_of_payment] || mode_of_payment.toLowerCase() });



  if (attachment) {
    const cleanPath = attachment.uri.startsWith('file://')
      ? decodeURIComponent(attachment.uri.replace('file://', ''))
      : attachment.uri;

    console.log(`[expenseApi] 📂 Attaching file: key="attachment", filename="${attachment.name || 'receipt.jpg'}", path="${cleanPath}", type="${attachment.type || 'image/jpeg'}"`);

    multipartBody.push({
      name: 'attachment',
      filename: attachment.name || 'receipt.jpg',
      type: attachment.type || 'image/jpeg',
      data: ReactNativeBlobUtil.wrap(cleanPath),
    });
  } else {
    multipartBody.push({ name: 'attachment_url', data: 'null' });
  }

  try {
    const response = await ReactNativeBlobUtil.fetch(
      'POST',
      url,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      multipartBody
    );

    const status = response.info().status;
    let json = null;
    try {
      json = response.json();
    } catch {
      try {
        json = JSON.parse(response.data);
      } catch {
        json = response.data;
      }
    }

    // 🔁 Token refresh logic
    if (status === 401) {
      const refreshToken = state.auth.refreshToken;
      if (refreshToken) {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { access_token } = refreshResponse.data;
        store.dispatch(updateTokens({ accessToken: access_token, refreshToken: '' }));
        await storage.set('userToken', access_token);

        const retryResponse = await ReactNativeBlobUtil.fetch(
          'POST',
          url,
          {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
          multipartBody
        );
        return retryResponse.json();
      }
    }

    if (status < 200 || status >= 300) {
      console.error('[addExpense] ❌ Error:', status, json);
      throw new Error(typeof json === 'object' ? json?.message || 'Failed to add expense' : 'Failed to add expense');
    }

    console.log('[addExpense] ✅ Success:', json);
    return json;
  } catch (error: any) {
    console.error('[addExpense] ❌ ERROR:', error);
    throw error;
  }
};
export const fetchExpenseDetails = async (id: string): Promise<any> => {
  console.log(`[expenseApi] GET expense/${id}`);
  try {
    const response = await apiClient.get(`expense/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('[expenseApi] Details fetch failed:', error?.message);
    throw error;
  }
};

export const getExpensePdf = async (id: string, isShare: boolean = false): Promise<any> => {
  const state = store.getState();
  const token = state.auth.userToken;
  const url = `${BASE_URL}/expense/${id}/receipt/pdf`;
  
  console.log(`[expenseApi] 📥 Downloading PDF for ${isShare ? 'sharing' : 'download'} (BlobUtil)`);
  
  try {
    const configOptions = isShare
      ? {
          fileCache: true,
          path: ReactNativeBlobUtil.fs.dirs.CacheDir + `/expense_receipt_${id}.pdf`,
        }
      : {
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: ReactNativeBlobUtil.fs.dirs.DownloadDir + `/expense_receipt_${id}.pdf`,
            description: 'Downloading Expense Receipt',
          },
        };

    const response = await ReactNativeBlobUtil.config(configOptions).fetch('GET', url, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    
    return response.path();
  } catch (error: any) {
    console.error('[expenseApi] PDF download failed:', error?.message);
    throw error;
  }
};

export interface ExpenseActivityParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  month?: number;
  year?: number;
}

export const fetchExpenseActivity = async (params: ExpenseActivityParams): Promise<any> => {
  console.log('[expenseApi] GET expense/activity', params);
  try {
    const response = await apiClient.get('expense/activity', { params });
    return response.data;
  } catch (error: any) {
    console.error('[expenseApi] Activity fetch failed:', error?.message);
    throw error;
  }
};
