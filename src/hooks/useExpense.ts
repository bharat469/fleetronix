import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchExpenseDashboard, 
  ExpenseDashboardParams, 
  addExpense, 
  AddExpenseParams,
  fetchExpenseDetails,
  getExpensePdf
} from '../services/expenseApi';

export const useExpenseDashboard = (params: ExpenseDashboardParams) => {
  return useQuery({
    queryKey: ['expenseDashboard', params.month, params.year, params.frequency],
    queryFn: () => fetchExpenseDashboard(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useExpenseDetails = (id: string) => {
  return useQuery({
    queryKey: ['expenseDetails', id],
    queryFn: () => fetchExpenseDetails(id),
    enabled: !!id,
  });
};

export const useDownloadReceipt = (options?: { onSuccess?: (path: string) => void, onError?: (error: any) => void }) => {
  return useMutation({
    mutationFn: (id: string) => getExpensePdf(id),
    onSuccess: (path) => {
      if (options?.onSuccess) options.onSuccess(path);
    },
    onError: (error) => {
      if (options?.onError) options.onError(error);
    },
  });
};

export const useAddExpense = (options?: { onSuccess?: (data: any) => void, onError?: (error: any) => void }) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: AddExpenseParams) => addExpense(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenseDashboard'] });
      if (options?.onSuccess) options.onSuccess(data);
    },
    onError: (error) => {
      if (options?.onError) options.onError(error);
    },
  });
};
