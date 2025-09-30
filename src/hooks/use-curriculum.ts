import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Curriculum, CurriculumPagination } from '@/lib/types'
import { useCurriculumStore } from '@/stores/curriculum-store'

const fetchCurriculumOriginalList = async (): Promise<Curriculum[]> => {
  const response = await fetch('/api/proxy/curriculum_original')
  if (!response.ok) {
    throw new Error('Failed to fetch curriculums')
  }
  const data = await response.json()
  // Normalize paginated or raw responses to an array of Curriculum
  if (Array.isArray(data)) return data
  if (data && data.data && Array.isArray(data.data.items)) return data.data.items
  if (data && Array.isArray(data.items)) return data.items
  return []
}

const fetchCurriculumCustomList = async (page?: number, limit?: number, searchQuery?: string, curriculumOriginalIds?: string[]): Promise<CurriculumPagination> => {
  const qs: string[] = []
  if (typeof page === 'number') qs.push(`page=${page}`)
  if (typeof limit === 'number') qs.push(`limit=${limit}`)
  if (searchQuery) qs.push(`search_text=${encodeURIComponent(searchQuery)}`)
  // include curriculum_original_id multiple times when provided
  if (Array.isArray(curriculumOriginalIds) && curriculumOriginalIds.length > 0) {
    curriculumOriginalIds.forEach(id => qs.push(`curriculum_original_id=${encodeURIComponent(id)}`))
  }
  const url = `/api/proxy/curriculum_custom${qs.length ? '?' + qs.join('&') : ''}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch curriculums')
  }
  const data = await response.json()

  // If the proxy already returned a pagination object
  if (data && Array.isArray(data.items) && typeof data.page === 'number') return data as CurriculumPagination

  // If wrapped under data.data
  if (data && data.data && Array.isArray(data.data.items)) return data.data as CurriculumPagination

  // If backend returned a plain array, wrap it
  if (Array.isArray(data)) {
    return {
      items: data as Curriculum[],
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    }
  }

  // If payload contains items but missing metadata, fill defaults
  if (data && Array.isArray(data.items)) {
    const items = data.items as Curriculum[]
    const total = data.total ?? items.length
    const limit = data.limit ?? items.length
    const page = data.page ?? 1
    const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit))
    return { items, total, page, limit, totalPages }
  }

  return { items: [], total: 0, page: 1, limit: 0, totalPages: 0 }
}

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
export const useCurriculumOriginal = () => {
  const setOriginal = useCurriculumStore(s => s.setOriginalCurriculums)

  const query = useQuery<Curriculum[], Error>({
    queryKey: curriculumKeys.lists(),
    queryFn: fetchCurriculumOriginalList,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (query.data) setOriginal(query.data)
  }, [query.data, setOriginal])

  return query
}

// Hook: get list of curriculum_custom
export const useCurriculumCustomList = (page?: number, limit?: number, searchQuery?: string, curriculumOriginalIds?: string[], enabled: boolean = true) => {
  const setCustom = useCurriculumStore(s => s.setCustomCurriculums)

  const query = useQuery<CurriculumPagination, Error>({
    // include searchQuery and curriculumOriginalIds so the query refetches when filters change
    queryKey: [...curriculumKeys.customLists(), { page, limit, searchQuery, curriculumOriginalIds }],
    queryFn: ({ queryKey }) => {
      // queryKey shape: [..., { page, limit, searchQuery, curriculumOriginalIds }]
      const last = queryKey[queryKey.length - 1] as { page?: number; limit?: number; searchQuery?: string; curriculumOriginalIds?: string[] }
      return fetchCurriculumCustomList(last?.page, last?.limit, last?.searchQuery, last?.curriculumOriginalIds)
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data && Array.isArray(query.data.items)) {
      setCustom(query.data.items)
    }
  }, [query.data, setCustom])

  return query
}

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
  
  return useMutation({
    mutationFn: createCurriculumCustom,
    onSuccess: (created: Curriculum) => {
      // Append to store eagerly
      const s = useCurriculumStore.getState()
      const next = [...(s.customCurriculums || []), created]
      s.setCustomCurriculums(next)
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
    },
  })
}

export const useUpdateCurriculumCustom = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateCurriculumCustom,
    onSuccess: (data: Curriculum) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
      queryClient.setQueryData(curriculumKeys.detail(data.id), data)
      const s = useCurriculumStore.getState()
      s.updateCustomCurriculum(data.id, data)
    },
  })
}

export const useDeleteCurriculumCustom = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCurriculumCustom,
    onSuccess: (_data, deletedId: string) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
      queryClient.removeQueries({ queryKey: curriculumKeys.detail(deletedId) })
      const s = useCurriculumStore.getState()
      const remaining = (s.customCurriculums || []).filter(c => c.id !== deletedId)
      s.setCustomCurriculums(remaining)
    },
  })
}
