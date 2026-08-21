import apiClient from '../api/apiClient';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Config from 'react-native-config';
import { store } from '../redux/store';
import { updateTokens } from '../redux/slices/authSlice';
import { storage } from '../helpers/asyncHelper';
import axios from 'axios';
import { Platform, PermissionsAndroid } from 'react-native';
import { notificationService } from './NotificationService';

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

const requestAndroidWritePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 29) return true; // Scoped storage does not need permission
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'This app needs access to your storage to download documents.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const getExpensePdf = async (id: string, isShare: boolean = false): Promise<any> => {
  const state = store.getState();
  let token = state.auth.userToken;
  const url = `${BASE_URL}/expense/${id}/receipt/pdf`;
  
  console.log(`[expenseApi] 📥 Downloading PDF for ${isShare ? 'sharing' : 'download'} (BlobUtil)`);
  console.log(`[expenseApi] 🔗 Target URL: ${url}`);
  console.log(`[expenseApi] 🔑 Token present: ${!!token}`);
  
  try {
    const tempPath = ReactNativeBlobUtil.fs.dirs.CacheDir + `/expense_receipt_${id}.pdf`;
    
    // Clean up existing file if any to prevent lock/overwrite issues
    if (await ReactNativeBlobUtil.fs.exists(tempPath)) {
      try {
        await ReactNativeBlobUtil.fs.unlink(tempPath);
      } catch {}
    }

    // Build headers securely to avoid OkHttp header value == null native crashes
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Download to CacheDir first using app's network stack (auth headers, VPN support)
    // Omit Accept: 'application/json' to support PDF content negotiation
    let response = await ReactNativeBlobUtil.config({
      fileCache: true, // Restored fileCache parameter
      path: tempPath,
    }).fetch('GET', url, headers);
    
    let status = response.info().status;
    console.log(`[expenseApi] GET PDF status code: ${status}`);

    // Token refresh logic if expired (401)
    if (status === 401) {
      console.log('[expenseApi] Token expired (401), attempting token refresh...');
      const refreshToken = state.auth.refreshToken;
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          const { access_token } = refreshResponse.data;
          store.dispatch(updateTokens({ accessToken: access_token, refreshToken: '' }));
          await storage.set('userToken', access_token);
          token = access_token;

          // Clean up cache file before retrying
          if (await ReactNativeBlobUtil.fs.exists(tempPath)) {
            try {
              await ReactNativeBlobUtil.fs.unlink(tempPath);
            } catch {}
          }

          // Build retry headers
          const retryHeaders: Record<string, string> = {};
          if (token) {
            retryHeaders['Authorization'] = `Bearer ${token}`;
          }

          // Retry download with new token
          console.log('[expenseApi] Retrying GET PDF with refreshed token...');
          response = await ReactNativeBlobUtil.config({
            fileCache: true,
            path: tempPath,
          }).fetch('GET', url, retryHeaders);
          status = response.info().status;
          console.log(`[expenseApi] GET PDF retry status code: ${status}`);
        } catch (refreshErr) {
          console.error('[expenseApi] Token refresh failed:', refreshErr);
        }
      }
    }

    if (status < 200 || status >= 300) {
      let errorMsg = `Server returned status code ${status}`;
      try {
        const text = await ReactNativeBlobUtil.fs.readFile(tempPath, 'utf8');
        const json = JSON.parse(text);
        if (json?.message) errorMsg = json.message;
      } catch {}
      
      // Clean up the error payload file in cache
      try {
        await ReactNativeBlobUtil.fs.unlink(tempPath);
      } catch {}
      
      throw new Error(errorMsg);
    }

    const path = response.path();

    // Verify file is not empty
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    if (Number(stat.size) === 0) {
      try {
        await ReactNativeBlobUtil.fs.unlink(path);
      } catch {}
      throw new Error('Downloaded receipt PDF is empty');
    }

    if (isShare) {
      return path;
    }

    if (Platform.OS === 'android') {
      const version = Number(Platform.Version);
      let targetPathForNotification = path;
      if (version >= 29) {
        // Scoped Storage (Android 10+): Use copyToMediaStore to safely write to downloads folder
        console.log('[expenseApi] Scoped Storage (API >= 29) detected, using copyToMediaStore');
        const mediaUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: `expense_receipt_${id}`,
            mimeType: 'application/pdf',
            parentFolder: '',
          },
          'Download',
          path
        );
        if (mediaUri) {
          targetPathForNotification = mediaUri;
        }
      } else {
        // Legacy Android (< 10): request permission and copy
        const hasPermission = await requestAndroidWritePermission();
        if (!hasPermission) {
          throw new Error('Storage write permission denied');
        }
        console.log('[expenseApi] API < 29 detected, copying directly to DownloadDir');
        const destPath = ReactNativeBlobUtil.fs.dirs.DownloadDir + `/expense_receipt_${id}.pdf`;
        
        if (await ReactNativeBlobUtil.fs.exists(destPath)) {
          try {
            await ReactNativeBlobUtil.fs.unlink(destPath);
          } catch {}
        }
        
        await ReactNativeBlobUtil.fs.cp(path, destPath);
        await ReactNativeBlobUtil.fs.scanFile([{ path: destPath, mime: 'application/pdf' }]);
        targetPathForNotification = destPath;
      }

      // Display local notification
      try {
        await notificationService.showLocalNotification(
          'File Downloaded',
          `expense_receipt_${id}.pdf has been saved to your downloads folder.`,
          { filePath: targetPathForNotification }
        );
      } catch (err) {
        console.error('[expenseApi] Error showing download notification:', err);
      }
    }

    return path;
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
