import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Word } from '@/types'

// API functions
const fetchWords = async (): Promise<Word[]> => {
  const response = await fetch('/api/words')
  if (!response.ok) {
    throw new Error('Failed to fetch words')
  }
  return response.json()
}

const fetchWordById = async (id: string): Promise<Word> => {
  const response = await fetch(`/api/word/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch word ${id}`)
  }
  return response.json()
}

const fetchWordsByLevel = async (levelId: string): Promise<Word[]> => {
  const response = await fetch(`/api/word/level2/${levelId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch words for level ${levelId}`)
  }
  return response.json()
}

const fetchWordsListByLevel = async (levelId: string): Promise<Word[]> => {
  const response = await fetch(`/api/word/level2/list/${levelId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch words list for level ${levelId}`)
  }
  return response.json()
}

const createWord = async (data: Omit<Word, 'id'>): Promise<Word> => {
  const response = await fetch('/api/words', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create word')
  }
  return response.json()
}

const updateWord = async ({ id, ...data }: Partial<Word> & { id: string }): Promise<Word> => {
  const response = await fetch(`/api/word/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update word')
  }
  return response.json()
}

const deleteWord = async (id: string): Promise<void> => {
  const response = await fetch(`/api/word/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete word')
  }
}

// Query keys
export const wordKeys = {
  all: ['words'] as const,
  lists: () => [...wordKeys.all, 'list'] as const,
  list: (filters: string) => [...wordKeys.lists(), { filters }] as const,
  details: () => [...wordKeys.all, 'detail'] as const,
  detail: (id: string) => [...wordKeys.details(), id] as const,
  byLevel: (levelId: string) => [...wordKeys.all, 'level', levelId] as const,
  byLevelList: (levelId: string) => [...wordKeys.all, 'level-list', levelId] as const,
}

// Hooks
export const useWords = () => {
  return useQuery({
    queryKey: wordKeys.lists(),
    queryFn: fetchWords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWord = (id: string) => {
  return useQuery({
    queryKey: wordKeys.detail(id),
    queryFn: () => fetchWordById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWordsByLevel = (levelId: string) => {
  return useQuery({
    queryKey: wordKeys.byLevel(levelId),
    queryFn: () => fetchWordsByLevel(levelId),
    enabled: !!levelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWordsListByLevel = (levelId: string) => {
  return useQuery({
    queryKey: wordKeys.byLevelList(levelId),
    queryFn: () => fetchWordsListByLevel(levelId),
    enabled: !!levelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateWord = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordKeys.lists() })
    },
  })
}

export const useUpdateWord = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateWord,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wordKeys.lists() })
      queryClient.setQueryData(wordKeys.detail(data.id), data)
      // Invalidate level-specific queries if word has level
      if (data.level) {
        queryClient.invalidateQueries({ queryKey: wordKeys.byLevel(data.level) })
        queryClient.invalidateQueries({ queryKey: wordKeys.byLevelList(data.level) })
      }
    },
  })
}

export const useDeleteWord = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteWord,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: wordKeys.lists() })
      queryClient.removeQueries({ queryKey: wordKeys.detail(deletedId) })
      // Invalidate all level queries since we don't know which level the deleted word belonged to
      queryClient.invalidateQueries({ queryKey: wordKeys.all })
    },
  })
}
