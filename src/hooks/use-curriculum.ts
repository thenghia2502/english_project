import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Curriculum, CurriculumPagination } from '@/lib/types'
import { useCurriculumOriginalStore } from '@/stores/curriculum-original-store'
import { useCurriculumCustomStore } from '@/stores/curriculum-custom-store'
import { apiFetch } from './apiFetch'

const fetchCurriculumOriginalList = async (page?: number, limit?: number, searchQuery?: string): Promise<CurriculumPagination> => {
  const qs: string[] = []
  if (typeof page === 'number') qs.push(`page=${page}`)
  if (typeof limit === 'number') qs.push(`limit=${limit}`)
  if (searchQuery) qs.push(`search_text=${encodeURIComponent(searchQuery)}`)
  
  const url = `/api/proxy/curriculum_original${qs.length ? '?' + qs.join('&') : ''}`
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch curriculums')
  }
  const data = await response.json()

  // If the proxy already returned a pagination object
  // if (data && Array.isArray(data.items) && typeof data.page === 'number') return data as CurriculumPagination

  // If wrapped under data.data
  // if (data && data.data && Array.isArray(data.data.items)) return data.data as CurriculumPagination

  // If backend returned a plain array, wrap it
  // if (Array.isArray(data)) {
  //   return {
  //     data: data as Curriculum[],
  //     total: data.length,
  //     page: 1,
  //     limit: data.length,
  //     totalPages: 1,
  //     meta: data.meta
  //   }
  // }

  // If payload contains items but missing metadata, fill defaults
  // if (data && Array.isArray(data.items)) {
  //   const items = data.items as Curriculum[]
  //   const total = data.total ?? items.length
  //   const limit = data.limit ?? items.length
  //   const page = data.page ?? 1
  //   const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit))
  //   return { data, total, page, limit, totalPages, meta: data.meta }
  // }

  // return { data: [], total: 0, page: 1, limit: 0, totalPages: 0, meta: undefined }
  return data
}

// const fetchCurriculumCustomList = async (page?: number, limit?: number, searchQuery?: string, curriculumOriginalIds?: string[]): Promise<CurriculumPagination> => {
//   const qs: string[] = []
//   if (typeof page === 'number') qs.push(`page=${page}`)
//   if (typeof limit === 'number') qs.push(`limit=${limit}`)
//   if (searchQuery) qs.push(`search_text=${encodeURIComponent(searchQuery)}`)
//   // include curriculum_original_id multiple times when provided
//   if (Array.isArray(curriculumOriginalIds) && curriculumOriginalIds.length > 0) {
//     curriculumOriginalIds.forEach(id => qs.push(`curriculum_original_id=${encodeURIComponent(id)}`))
//   }
//   const url = `/api/proxy/curriculum_custom${qs.length ? '?' + qs.join('&') : ''}`
//   const response = await apiFetch(url)
//   if (!response.ok) {
//     throw new Error('Failed to fetch curriculums')
//   }
//   const data = await response.json()

//   // If the proxy already returned a pagination object
//   if (data && Array.isArray(data.items) && typeof data.page === 'number') return data as CurriculumPagination

//   // If wrapped under data.data
//   if (data && data.data && Array.isArray(data.data.items)) return data.data as CurriculumPagination

//   // If backend returned a plain array, wrap it
//   if (Array.isArray(data)) {
//     return {
//       data: data as Curriculum[],
//       total: data.length,
//       page: 1,
//       limit: data.length,
//       totalPages: 1,
//       meta: data.meta
//     }
//   }

//   // If payload contains items but missing metadata, fill defaults
//   if (data && Array.isArray(data.items)) {
//     const items = data.items as Curriculum[]
//     const total = data.total ?? items.length
//     const limit = data.limit ?? items.length
//     const page = data.page ?? 1
//     const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit))
//     return { data, total, page, limit, totalPages, meta: data.meta }
//   }

//   return { data: [], total: 0, page: 1, limit: 0, totalPages: 0, meta: undefined }
// }

const fetchCurriculumCustomById = async (id: string): Promise<Curriculum> => {
  const response = await fetch(`/api/proxy/curriculum_custom/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch custom curriculum ${id}`)
  }
  return response.json()
}

const fetchCurriculumOriginalById = async (id: string): Promise<Curriculum> => {
  const response = await fetch(`/api/proxy/curriculum_original/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch curriculum ${id}`)
  }
  return response.json()
}

// Create/update/delete operate on curriculum_custom endpoints
// For creation we accept list_unit as an array of unit ids (string[])
type CreateCurriculumPayload = { curriculum_original_id: string, name: string, level_id: string, list_unit: string[] }
const createCurriculumCustom = async (data: CreateCurriculumPayload): Promise<Curriculum> => {
  const response = await fetch('/api/proxy/curriculum_custom/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create curriculum')
  return response.json()
}
type UpdateCurriculumPayload = { id: string, curriculum_original_id: string, name: string, level_id: string, list_unit: string[] }
const updateCurriculumCustom = async (data: UpdateCurriculumPayload): Promise<Curriculum> => {
  const response = await fetch('/api/proxy/curriculum_custom/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update curriculum')
  return response.json()
}

const deleteCurriculumCustom = async (id: string): Promise<void> => {
  const response = await fetch('/api/proxy/curriculum_custom/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!response.ok) throw new Error('Failed to delete curriculum')
}

export interface WorkbookResponse {
  workbookUrl?: string
  workbookId?: string
  workbook_id?: string
  id_wb?: string
  url?: string
  id: string
  [key: string]: unknown
}

const getWorkbook = async (curriculumId: string): Promise<WorkbookResponse> => {
  const response = await fetch(`/api/proxy/curriculum_original/${encodeURIComponent(curriculumId)}/workbooks?idCurriculum=${encodeURIComponent(curriculumId)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch workbook for curriculum ${curriculumId}`)
  }
  const data = await response.json()

  if (Array.isArray(data) && data.length > 0) {
    return data[0] as WorkbookResponse
  }

  if (data && typeof data === 'object' && 'data' in data && data.data) {
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as WorkbookResponse
    }
    return data.data as WorkbookResponse
  }

  return (data ?? {}) as WorkbookResponse
}


// Query keys
export const curriculumKeys = {
  all: ['curriculums'] as const,
  lists: () => [...curriculumKeys.all, 'list'] as const,
  list: (filters?: string) => [...curriculumKeys.lists(), { filters }] as const,
  details: () => [...curriculumKeys.all, 'detail'] as const,
  detail: (id: string) => [...curriculumKeys.details(), id] as const,
  customLists: () => [...curriculumKeys.all, 'custom_list'] as const,
  levels: () => [...curriculumKeys.all, 'levels'] as const,
}

// Hooks
export const useCurriculumOriginal = (page?: number, limit?: number, searchQuery?: string, enabled: boolean = true) => {
  const setOriginal = useCurriculumOriginalStore(s => s.setPagination)

  const query = useQuery<CurriculumPagination, Error>({
    // Include page, limit, searchQuery in queryKey so the query refetches when filters change
    queryKey: [...curriculumKeys.lists(), { page, limit, searchQuery }],
    queryFn: ({ queryKey }) => {
      // queryKey shape: [..., { page, limit, searchQuery }]
      const last = queryKey[queryKey.length - 1] as { page?: number; limit?: number; searchQuery?: string }
      return fetchCurriculumOriginalList(last?.page, last?.limit, last?.searchQuery)
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (query.data) setOriginal(query.data)
  }, [query.data, setOriginal])

  return query
}

// Hook: get list of curriculum_custom
// export const useCurriculumCustomList = (page?: number, limit?: number, searchQuery?: string, curriculumOriginalIds?: string[], enabled: boolean = true) => {
//   const setCustom = useCurriculumCustomStore(s => s.setPagination)

//   const query = useQuery<CurriculumPagination, Error>({
//     // include searchQuery and curriculumOriginalIds so the query refetches when filters change
//     queryKey: [...curriculumKeys.customLists(), { page, limit, searchQuery, curriculumOriginalIds }],
//     queryFn: ({ queryKey }) => {
//       // queryKey shape: [..., { page, limit, searchQuery, curriculumOriginalIds }]
//       const last = queryKey[queryKey.length - 1] as { page?: number; limit?: number; searchQuery?: string; curriculumOriginalIds?: string[] }
//       return fetchCurriculumCustomList(last?.page, last?.limit, last?.searchQuery, last?.curriculumOriginalIds)
//     },
//     enabled,
//     staleTime: 2 * 60 * 1000, // Increase stale time to 2 minutes to reduce unnecessary refetches
//     retry: 1, // Only retry once on failure
//     retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
//   })

//   useEffect(() => {
//     if (query.data) {
//       setCustom(query.data)
//     }
//   }, [query.data, setCustom])

//   return query
// }

export const useCurriculumOriginalById = (id: string) => {
  return useQuery<Curriculum, Error>({
    queryKey: curriculumKeys.detail(id),
    queryFn: () => fetchCurriculumOriginalById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCurriculumCustomById = (id: string) => {
  return useQuery<Curriculum, Error>({
    queryKey: [...curriculumKeys.details(), 'custom', id],
    queryFn: () => fetchCurriculumCustomById(id),
    enabled: !!id,
    staleTime: 0, // Always refetch to ensure fresh data for edit mode
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  })
}

export const useCreateCurriculumCustom = () => {
  const queryClient = useQueryClient()
  const store = useCurriculumCustomStore()
  
  return useMutation({
    mutationFn: createCurriculumCustom,
    onSuccess: (created: Curriculum) => {
      // Update store first for immediate UI feedback
      const currentCurriculums = store.curriculums
      const next = [...currentCurriculums, created]
      store.setCurriculums(next)
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: curriculumKeys.customLists(),
        refetchType: 'all'
      })
    },
    retry: 1, // Only retry once on failure
  })
}

export const useUpdateCurriculumCustom = () => {
  const queryClient = useQueryClient()
  const store = useCurriculumCustomStore()
  
  return useMutation({
    mutationFn: updateCurriculumCustom,
    onSuccess: (data: Curriculum) => {
      // Update store first for immediate UI feedback
      store.updateCurriculum(data.id, data)
      
      // Update the specific query data in cache
      queryClient.setQueryData([...curriculumKeys.details(), 'custom', data.id], data)
      
      // Invalidate list queries to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: curriculumKeys.customLists(),
        refetchType: 'all'
      })
    },
    retry: 1, // Only retry once on failure
  })
}

export const useDeleteCurriculumCustom = () => {
  const queryClient = useQueryClient()
  const store = useCurriculumCustomStore()
  
  return useMutation({
    mutationFn: deleteCurriculumCustom,
    onMutate: async (deletedId: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: curriculumKeys.customLists() })

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: curriculumKeys.customLists() })

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: curriculumKeys.customLists() }, (old: unknown) => {
        if (!old) return old
        const oldData = old as CurriculumPagination
        if (Array.isArray(oldData.data)) {
          return { ...oldData, data: oldData.data.filter((item: Curriculum) => item.id !== deletedId) }
        }
        return old
      })

      // Update store immediately
      store.deleteCurriculum(deletedId)

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      queryClient.invalidateQueries({ 
        queryKey: curriculumKeys.customLists()
      })
    },
    retry: 1, // Only retry once on failure
  })

}

export const useGetWorkbook = (curriculumId: string) => {
  return useQuery<WorkbookResponse, Error>({
    queryKey: [...curriculumKeys.detail(curriculumId), 'workbook'],
    queryFn: () => getWorkbook(curriculumId),
    enabled: !!curriculumId,
  })
}

