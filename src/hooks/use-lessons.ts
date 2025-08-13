import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lesson } from '@/types'

// API functions
const fetchLessons = async (format?: 'names'): Promise<Lesson[]> => {
  const url = format ? `/api/danhsachtu?format=${format}` : '/api/danhsachtu'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch lessons')
  }
  return response.json()
}

const fetchLessonById = async (id: string): Promise<Lesson> => {
  const response = await fetch(`/api/lessons/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch lesson ${id}`)
  }
  return response.json()
}

const createLesson = async (data: Omit<Lesson, 'createdAt' | 'updatedAt'>): Promise<Lesson> => {
  const response = await fetch('/api/danhsachtu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create lesson')
  }
  return response.json()
}

const updateLesson = async ({ id, ...data }: Partial<Lesson> & { id: string }): Promise<Lesson> => {
  const response = await fetch('/api/danhsachtu', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  })
  if (!response.ok) {
    throw new Error('Failed to update lesson')
  }
  return response.json()
}

const deleteLesson = async (id: string): Promise<void> => {
  const response = await fetch(`/api/danhsachtu/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete lesson')
  }
}

// Query keys
export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  list: (filters: string) => [...lessonKeys.lists(), { filters }] as const,
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: string) => [...lessonKeys.details(), id] as const,
  names: () => [...lessonKeys.all, 'names'] as const,
}

// Hooks
export const useLessons = (format?: 'names') => {
  return useQuery({
    queryKey: format ? lessonKeys.names() : lessonKeys.lists(),
    queryFn: () => fetchLessons(format),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLesson = (id: string) => {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => fetchLessonById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: lessonKeys.names() })
    },
  })
}

export const useUpdateLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateLesson,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: lessonKeys.names() })
      queryClient.setQueryData(lessonKeys.detail(data.id), data)
    },
  })
}

export const useDeleteLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
      queryClient.invalidateQueries({ queryKey: lessonKeys.names() })
      queryClient.removeQueries({ queryKey: lessonKeys.detail(deletedId) })
    },
  })
}
