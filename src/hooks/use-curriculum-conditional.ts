import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Curriculum } from '@/lib/types';

// Import fetch functions từ use-curriculum
const fetchCurriculumOriginalList = async (): Promise<Curriculum[]> => {
  const response = await fetch('/api/proxy/curriculum_original')
  if (!response.ok) {
    throw new Error('Failed to fetch curriculums')
  }
  const data = await response.json()
  if (Array.isArray(data)) return data
  if (data && data.data && Array.isArray(data.data.items)) return data.data.items
  if (data && Array.isArray(data.items)) return data.items
  return []
}

const fetchCurriculumOriginalById = async (id: string): Promise<Curriculum> => {
  const response = await fetch(`/api/proxy/curriculum_original/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch curriculum with id: ${id}`)
  }
  return response.json()
}

/**
 * Hook tối ưu thực sự - chỉ fetch data cần thiết
 */
export const useCurriculumConditional = (id?: string) => {
  const shouldFetchById = !!(id && id !== '');
  
  // Debug: Track when this hook is called
  console.log('🔍 useCurriculumConditional called with:', { id, shouldFetchById });
  
  // Chỉ fetch by ID khi có id
  const byIdQuery = useQuery<Curriculum, Error>({
    queryKey: ['curriculum', 'detail', id],
    queryFn: () => fetchCurriculumOriginalById(id!),
    enabled: shouldFetchById,
    staleTime: 5 * 60 * 1000,
  });
  
  // Chỉ fetch list khi không có id
  const listQuery = useQuery<Curriculum[], Error>({
    queryKey: ['curriculum', 'list'],
    queryFn: fetchCurriculumOriginalList,
    enabled: !shouldFetchById,
    staleTime: 5 * 60 * 1000,
  });
  
  return useMemo(() => {
    if (shouldFetchById) {
      return {
        curriculum: byIdQuery.data || null,
        curriculums: byIdQuery.data ? [byIdQuery.data] : [],
        isLoading: byIdQuery.isLoading,
        error: byIdQuery.error,
      };
    }
    
    return {
      curriculum: listQuery.data?.[0] || null,
      curriculums: listQuery.data || [],
      isLoading: listQuery.isLoading,
      error: listQuery.error,
    };
  }, [shouldFetchById, byIdQuery, listQuery]);
};