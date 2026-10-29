import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/AuthProvider';
import type { SuggestionLists } from '@/models/expense';
import { loadSuggestions, rememberSuggestions } from '@/services/users/userService';

const EMPTY: SuggestionLists = { enforcementOffices: [], clientNames: [] };

export function useSuggestions() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['suggestions', uid],
    enabled: Boolean(user),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: () => loadSuggestions(uid),
  });

  async function remember(incoming: SuggestionLists): Promise<void> {
    if (!user) {
      return;
    }
    const current = query.data ?? EMPTY;
    const next = await rememberSuggestions(user.uid, current, incoming);
    queryClient.setQueryData(['suggestions', user.uid], next);
  }

  return {
    suggestions: query.data ?? EMPTY,
    isLoading: query.isLoading,
    remember,
  };
}
