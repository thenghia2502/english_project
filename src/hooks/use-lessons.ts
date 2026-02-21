import { Lesson, UpdateLessonPayload } from '@/lib/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'

// API functions - map to server endpoints
const fetchLessonList = async (search: string, limit: number, page: number, sortBy?: string, sortOrder?: string) => {
  const response = await apiFetch(`/api/proxy/lesson?search=${search}&limit=${limit}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
  if (!response.ok) throw new Error('Failed to fetch lessons')
  return response.json()
}

const fetchLessonById = async (id: string): Promise<Lesson> => {
  const response = await fetch(`/api/proxy/lesson/${id}`)
  if (!response.ok) throw new Error(`Failed to fetch lesson ${id}`)
  return response.json()
}

const createLesson = async (payload: { name?: string; order?: number; words?: {"word_id": string,
      "word_max_read": string,
      "word_show_ipa": string,
      "word_show_word": string,
      "word_show_ipa_and_word": string,
      "word_reads_per_round": string,
      "word_pause_time": string}[], unit_ids?: string[], curriculum_original_id?: string }): Promise<Lesson> => {
  const response = await fetch('/api/proxy/lesson/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to create lesson')
  return response.json()
}

const updateLesson = async (payload: UpdateLessonPayload): Promise<Lesson> => {
  const response = await fetch('/api/proxy/lesson/update-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to update lesson')
  return response.json()
}

const updateLessonWords = async (payload: {
  lesson_id: string, words: {
    word_id: string,
    word_progress: string,
    word_max_read: string,
    word_show_ipa: string,
    word_show_word: string,
    word_show_ipa_and_word: string,
    word_reads_per_round: string,
    word_pause_time: string
  }[]
}): Promise<Lesson> => {
  const response = await fetch('/api/proxy/lesson/update-words', {
    method: 'POST',
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
export const useLessons = (Search: string, Limit: number, Page: number, SortBy?: string, SortOrder?: string) => {
  return useQuery({
    queryKey: [...lessonKeys.lists(), Search, Limit, Page, SortBy, SortOrder],
    queryFn: () => fetchLessonList(Search, Limit, Page, SortBy, SortOrder),
    staleTime: 1000 * 60 * 5, // 5 phút stale time để tránh excessive refetch
    gcTime: 1000 * 60 * 10, // 10 phút cache time
    refetchOnMount: 'always', // Refetch nếu dữ liệu stale khi mount
    refetchOnWindowFocus: 'always', // Refetch nếu dữ liệu stale khi focus window
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
    onSuccess: async (data) => {
      // Debug log để track khi nào được gọi
      console.log('🔄 useUpdateLesson onSuccess called with:', data.id)

      // Cập nhật cache local cho lesson detail
      queryClient.setQueryData(lessonKeys.detail(data.id), data)

      // Throttle invalidation để tránh multiple calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Invalidate lessons list - use 'all' to ensure refetch even if inactive
      await queryClient.invalidateQueries({
        queryKey: lessonKeys.lists(),
        exact: true,
        refetchType: 'all'
      })

      console.log('✅ useUpdateLesson invalidation completed')
    },
  })
}

export const useUpdateLessonWords = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLessonWords,
    onSuccess: async (data) => {
      // Debug log để track khi nào được gọi
      console.log('🔄 useUpdateLessonWords onSuccess called with:', data.id)

      // Cập nhật cache local cho lesson detail
      queryClient.setQueryData(lessonKeys.detail(data.id), data)

      // Throttle invalidation để tránh multiple calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Invalidate lessons list - use 'all' to ensure refetch even if inactive
      await queryClient.invalidateQueries({
        queryKey: lessonKeys.lists(),
        exact: true,
        refetchType: 'all'
      })

      console.log('✅ useUpdateLessonWords invalidation completed')
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