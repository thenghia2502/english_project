
import { useCurriculumOriginalById } from "@/hooks";

export function useBookPage(bookId: string) {
    const { data, isLoading, error } = useCurriculumOriginalById(bookId)
    return { data, isLoading, error }
}