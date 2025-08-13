import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Curriculum, Level } from '@/types'

// API functions
const fetchCurriculums = async (): Promise<Curriculum[]> => {
  const response = await fetch('/api/curriculum')
  if (!response.ok) {
    throw new Error('Failed to fetch curriculums')
  }
  return response.json()
}

const fetchCurriculumById = async (id: string): Promise<Curriculum> => {
  const response = await fetch(`/api/curriculum/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch curriculum ${id}`)
  }
  return response.json()
}

const fetchLevels = async (): Promise<Level[]> => {
  const response = await fetch('/api/curriculum/levels')
  if (!response.ok) {
    throw new Error('Failed to fetch levels')
  }
  return response.json()
}

const createCurriculum = async (data: Omit<Curriculum, 'id'>): Promise<Curriculum> => {
  const response = await fetch('/api/curriculum', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create curriculum')
  }
  return response.json()
}

const updateCurriculum = async ({ id, ...data }: Partial<Curriculum> & { id: string }): Promise<Curriculum> => {
  const response = await fetch(`/api/curriculum/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update curriculum')
  }
  return response.json()
}

const deleteCurriculum = async (id: string): Promise<void> => {
  const response = await fetch(`/api/curriculum/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete curriculum')
  }
}

// Query keys
export const curriculumKeys = {
  all: ['curriculums'] as const,
  lists: () => [...curriculumKeys.all, 'list'] as const,
  list: (filters: string) => [...curriculumKeys.lists(), { filters }] as const,
  details: () => [...curriculumKeys.all, 'detail'] as const,
  detail: (id: string) => [...curriculumKeys.details(), id] as const,
  levels: () => ['curriculum-levels'] as const,
}

// Hooks
export const useCurriculums = () => {
  return useQuery({
    queryKey: curriculumKeys.lists(),
    queryFn: fetchCurriculums,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCurriculum = (id: string) => {
  return useQuery({
    queryKey: curriculumKeys.detail(id),
    queryFn: () => fetchCurriculumById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLevels = () => {
  return useQuery({
    queryKey: curriculumKeys.levels(),
    queryFn: fetchLevels,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateCurriculum = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCurriculum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
    },
  })
}

export const useUpdateCurriculum = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateCurriculum,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
      queryClient.setQueryData(curriculumKeys.detail(data.id), data)
    },
  })
}

export const useDeleteCurriculum = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCurriculum,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.lists() })
      queryClient.removeQueries({ queryKey: curriculumKeys.detail(deletedId) })
    },
  })
}
