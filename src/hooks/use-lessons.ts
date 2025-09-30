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
    staleTime: 0, // Luôn refetch để đảm bảo dữ liệu mới nhất
    gcTime: 0, // Không cache data
  })
}

export const useLesson = (id: string) => {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => fetchLessonById(id),
    enabled: !!id,
    staleTime: 0, // Luôn refetch để đảm bảo dữ liệu mới nhất
    gcTime: 0, // Không cache data
  })
}

export const useCreateLesson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLesson,
    onSuccess: async () => {
      // Clear all lesson caches completely
      queryClient.removeQueries({ queryKey: lessonKeys.all })
      // Clear curriculum custom caches (for edit mode)
      queryClient.removeQueries({ queryKey: ['curriculums'] })
      // Force invalidate and refetch all lesson queries
      await queryClient.invalidateQueries({ 
        queryKey: lessonKeys.all,
        refetchType: 'all' 
      })
      // Force invalidate curriculum custom queries
      await queryClient.invalidateQueries({ 
        queryKey: ['curriculums'],
        refetchType: 'all' 
      })
      // Manually refetch the lessons list
      await queryClient.refetchQueries({ queryKey: lessonKeys.lists() })
    },
  })
}

export const useUpdateLesson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLesson,
    onSuccess: (data) => {
      // Chỉ cập nhật cache local, không refetch
      queryClient.setQueryData(lessonKeys.detail(data.id), data)
      // Invalidate lists để cập nhật progress/done status
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
    },
  })
}

export const useDeleteLesson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: async () => {
      // Clear all lesson caches completely
      queryClient.removeQueries({ queryKey: lessonKeys.all })
      // Clear curriculum custom caches (for edit mode)
      queryClient.removeQueries({ queryKey: ['curriculums'] })
      // Force invalidate and refetch all lesson queries
      await queryClient.invalidateQueries({ 
        queryKey: lessonKeys.all,
        refetchType: 'all' 
      })
      // Force invalidate curriculum custom queries
      await queryClient.invalidateQueries({ 
        queryKey: ['curriculums'],
        refetchType: 'all' 
      })
      // Manually refetch the lessons list
      await queryClient.refetchQueries({ queryKey: lessonKeys.lists() })
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
    staleTime: 0, // Luôn refetch để đảm bảo dữ liệu mới nhất
    gcTime: 0, // Không cache data
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  })
}