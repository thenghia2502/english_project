import { useLessons } from "@/hooks";
import { Lesson } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SortOption = "newest" | "oldest" | "progress-asc" | "progress-desc"
type SortOptionValue = {
    "newest": { 
        sortBy: "created_at",
        sortOrder: "desc"
    },
    "oldest": { 
        sortBy: "created_at",
        sortOrder: "asc"
    },
    "progress-asc": { 
        sortBy: "progress",
        sortOrder: "asc"
    },
    "progress-desc": { 
        sortBy: "progress",
        sortOrder: "desc" 
    }
}

const SORT_OPTION_VALUE: SortOptionValue = {
    "newest": { 
        sortBy: "created_at",
        sortOrder: "desc"
    },
    "oldest": { 
        sortBy: "created_at",
        sortOrder: "asc"
    },
    "progress-asc": { 
        sortBy: "progress",
        sortOrder: "asc"
    },
    "progress-desc": { 
        sortBy: "progress",
        sortOrder: "desc" 
    }
}
export function useLessonTab() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("")
    const [limit, setLimit] = useState(9);
    const [sortOption, setSortOption] = useState<SortOption>("newest")
    const sortBy = SORT_OPTION_VALUE[sortOption]
    const { data, isLoading, error } = useLessons(searchTerm, limit, page, sortBy.sortBy, sortBy.sortOrder);

    const meta = data?.meta
    const totalPages = useMemo(() => {
        if (!meta?.total) return 1
        if (meta.totalPages) return meta.totalPages
        return Math.max(1, Math.ceil(meta.total / (meta.limit || limit)))
    }, [meta?.total, meta?.totalPages, meta?.limit, limit])
    const startLearning = (lesson: Lesson) => {
        router.push(`/hoctu?lessonId=${lesson.id}`)
    }

    return {
        // lessons: filteredAndSortedLessons,
        isLoading,
        error: error ? error.message : null,
        startLearning,
        searchTerm,
        setSearchTerm,
        sortOption,
        setSortOption,
        setPage,
        setLimit,
        page,
        data,
        meta,
        totalPages
    };
}  