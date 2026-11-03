import { useQuery } from '@tanstack/react-query'
import { currentUserApi } from '../api/currentUserApi'

// Cached for a minute; cleared with the rest of the query cache on logout.
export function useCurrentUser() {
    return useQuery({
        queryKey: ['current-user'],
        queryFn: async () => (await currentUserApi.get()).data,
        staleTime: 60_000
    })
}
