import { useQuery, useQueryClient } from '@tanstack/react-query';

import { DELIVERY_URL_STALE_MS, QUERY_STALE_TIME_MS } from '@/constants/limits';
import type { AttachmentResourceType } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { requestDeliveryUrl } from '@/services/cloudinary/cloudinaryClient';
import { findExpenseInListCache } from '@/services/expenses/cacheUpdates';
import { getExpense } from '@/services/expenses/expenseService';

export function useExpense(expenseId: string) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['expense', uid, expenseId],
    enabled: Boolean(user && expenseId),
    staleTime: QUERY_STALE_TIME_MS,
    queryFn: () => getExpense(uid, expenseId),
    initialData: () => findExpenseInListCache(queryClient, uid, expenseId),
    initialDataUpdatedAt: () => (findExpenseInListCache(queryClient, uid, expenseId) ? Date.now() : undefined),
  });
}

export function useDeliveryUrl(publicId: string | null, resourceType: AttachmentResourceType | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['delivery', user?.uid ?? 'none', publicId ?? 'none'],
    enabled: Boolean(user && publicId && resourceType),
    staleTime: DELIVERY_URL_STALE_MS,
    gcTime: DELIVERY_URL_STALE_MS,
    queryFn: () => requestDeliveryUrl({ publicId: publicId as string, resourceType: resourceType as AttachmentResourceType }),
  });
}
