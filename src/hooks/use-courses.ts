import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Course } from '@/types'

// API functions
const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch('/api/courses')
  if (!response.ok) {
    throw new Error('Failed to fetch courses')
  }

  return response.json()
}

const fetchCourseById = async (id: string): Promise<Course> => {
  const response = await fetch(`/api/courses/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch course ${id}`)
  }
  return response.json()
}

const createCourse = async (data: Omit<Course, 'id' | 'createdAt'>): Promise<Course> => {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create course')
  }
  return response.json()
}

const updateCourse = async ({ id, ...data }: Partial<Course> & { id: string }): Promise<Course> => {
  const response = await fetch(`/api/courses/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  })
  if (!response.ok) {
    throw new Error('Failed to update course')
  }
  return response.json()
}

const deleteCourse = async (id: string): Promise<void> => {
  const response = await fetch(`/api/courses/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete course')
  }
}

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: string) => [...courseKeys.lists(), { filters }] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
}

// Hooks
export const useCourses = () => {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => fetchCourseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateCourse,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.setQueryData(courseKeys.detail(data.id), data)
    },
  })
}

export const useDeleteCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.removeQueries({ queryKey: courseKeys.detail(deletedId) })
    },
  })
}
