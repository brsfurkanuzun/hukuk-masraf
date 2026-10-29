import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/AuthProvider';
import { listTutanaklar } from '@/services/tutanak/tutanakService';

export function useTutanaklar(dosyaId: string) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: ['tutanaklar', uid, dosyaId],
    enabled: Boolean(user && dosyaId),
    queryFn: () => listTutanaklar(dosyaId),
  });
}

export function useRefreshTutanaklar(dosyaId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async () => {
    if (!user) {
      return;
    }
    await queryClient.resetQueries({ queryKey: ['tutanaklar', user.uid, dosyaId], exact: true });
  };
}
