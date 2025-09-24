import { Lesson } from '@/lib/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// API functions - map to server endpoints
const fetchLessonList = async (): Promise<Lesson[]> => {
  const response = await fetch('/api/proxy/lesson')
  if (!response.ok) throw new Error('Failed to fetch lessons')
  return response.json()
}

const fetchLessonById = async (id: string): Promise<Lesson> => {
  const response = await fetch(`/api/proxy/lesson/${id}`)
  if (!response.ok) throw new Error(`Failed to fetch lesson ${id}`)
  return response.json()
}

const createLesson = async (payload: { id: string; name?: string; order?: number; workIds?: string[] }): Promise<Lesson> => {
  const response = await fetch('/api/proxy/lesson/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to create lesson')
  return response.json()
}

const updateLesson = async (payload: Lesson): Promise<Lesson> => {
  const response = await fetch('/api/proxy/lesson/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to update lesson')
  return response.json()
}

const deleteLesson = async (id: string): Promise<void> => {
  const response = await fetch('/api/proxy/lesson/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!response.ok) throw new Error('Failed to delete lesson')
}

// Query keys
export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: string) => [...lessonKeys.details(), id] as const,
}

// Hooks
export const useLessons = () => {
  return useQuery({
    queryKey: lessonKeys.lists(),
    queryFn: fetchLessonList,
    staleTime: 5 * 60 * 1000,
  })
}

export const useLesson = (id: string) => {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => fetchLessonById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateLesson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lessonKeys.lists() }),
  })
}

export const useUpdateLesson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLesson,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
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
      queryClient.removeQueries({ queryKey: lessonKeys.detail(deletedId) })
    },
  })
}

export const useLessonById = (id?: string | null) => {
  // If no id is provided, avoid registering a detail query key for an empty id.
  // We still return the useQuery result but use a safe noop key when id is falsy.
  const queryKey = id ? lessonKeys.detail(id) : lessonKeys.details()

  return useQuery({
    queryKey,
    queryFn: () => (id ? fetchLessonById(id) : Promise.resolve(undefined as unknown as Lesson)),
    // only run the fetch when we have a valid id
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}