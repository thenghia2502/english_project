# Zustand & React Query Integration

## Cấu hình đã hoàn thành

### 📦 Packages đã cài đặt
- `zustand` - State management
- `@tanstack/react-query` - Data fetching & caching
- `@tanstack/react-query-devtools` - Debugging tools

### 🏗️ Cấu trúc dự án

```
src/
├── providers/
│   └── query-provider.tsx     # React Query configuration
├── stores/
│   ├── ui-store.ts           # UI state (loading, errors, selection)
│   ├── curriculum-store.ts   # Curriculum data & cache
│   ├── course-store.ts       # Courses & lessons data
│   └── index.ts              # Store exports
├── hooks/
│   ├── use-curriculum.ts     # Curriculum API calls
│   ├── use-lessons.ts        # Lesson API calls  
│   ├── use-courses.ts        # Course API calls
│   ├── use-words.ts          # Words API calls
│   └── index.ts              # Hook exports
├── types/
│   └── index.ts              # TypeScript interfaces
└── components/
    └── example-usage.tsx     # Usage examples
```

## 🚀 Cách sử dụng

### 1. React Query Hooks

```tsx
import { useCurriculums, useCourses, useLesson } from '@/hooks'

function MyComponent() {
  // Fetch data with caching & error handling
  const { data: curriculums, isLoading, error } = useCurriculums()
  const { data: courses } = useCourses()
  const { data: lesson } = useLesson(lessonId)
  
  // Mutations
  const createCourse = useCreateCourse()
  const updateLesson = useUpdateLesson()
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {curriculums?.map(curriculum => (
        <div key={curriculum.id}>{curriculum.title}</div>
      ))}
    </div>
  )
}
```

### 2. Zustand Stores

```tsx
import { useUIStore, useCurriculumStore } from '@/stores'

function MyComponent() {
  // UI state
  const { isLoading, error, setLoading, setError } = useUIStore()
  
  // Curriculum state
  const { 
    selectedCurriculum, 
    setSelectedCurriculum,
    selectedLevel,
    setSelectedLevel 
  } = useCurriculumStore()
  
  const handleSelect = () => {
    setSelectedCurriculum(curriculum)
    setLoading(true)
  }
  
  return <div>...</div>
}
```

### 3. Kết hợp cả hai

```tsx
import { useCurriculums } from '@/hooks'
import { useCurriculumStore } from '@/stores'

function CurriculumList() {
  // Data từ React Query
  const { data: curriculums, isLoading } = useCurriculums()
  
  // State từ Zustand
  const { selectedCurriculum, setSelectedCurriculum } = useCurriculumStore()
  
  return (
    <div>
      {curriculums?.map(curriculum => (
        <button
          key={curriculum.id}
          className={selectedCurriculum?.id === curriculum.id ? 'selected' : ''}
          onClick={() => setSelectedCurriculum(curriculum)}
        >
          {curriculum.title}
        </button>
      ))}
    </div>
  )
}
```

## 🎯 Stores được tạo

### UIStore
- Loading states (`isLoading`, `isSubmitting`)
- Error handling (`error`, `setError`, `clearError`)
- Pagination (`currentPage`, `itemsPerPage`)
- Selection (`selectedItems`, `toggleItemSelection`)
- Modal states (`isModalOpen`, `modalType`)

### CurriculumStore
- Selected curriculum & level
- Curriculum cache for performance
- Update methods with cache invalidation

### CourseStore  
- Courses & lessons data
- Form state for course creation
- Cache management for both courses & lessons

## 🔧 API Hooks

### Curriculum
- `useCurriculums()` - Get all curriculums
- `useCurriculum(id)` - Get specific curriculum
- `useCreateCurriculum()` - Create mutation
- `useUpdateCurriculum()` - Update mutation
- `useDeleteCurriculum()` - Delete mutation

### Lessons
- `useLessons(format?)` - Get lessons (với option format='names')
- `useLesson(id)` - Get specific lesson
- `useCreateLesson()` - Create mutation
- `useUpdateLesson()` - Update mutation
- `useDeleteLesson()` - Delete mutation

### Courses
- `useCourses()` - Get all courses
- `useCourse(id)` - Get specific course
- `useCreateCourse()` - Create mutation
- `useUpdateCourse()` - Update mutation
- `useDeleteCourse()` - Delete mutation

### Words
- `useWords()` - Get all words
- `useWord(id)` - Get specific word
- `useWordsByLevel(levelId)` - Get words by level
- `useWordsListByLevel(levelId)` - Get words list by level

## ✨ Tính năng đặc biệt

### Automatic Cache Management
- Query invalidation sau mutations
- Smart cache updates
- Optimistic updates support

### Error Handling
- Retry logic for failed requests
- Centralized error state
- User-friendly error messages

### Performance Optimization
- Data caching với staleTime
- Background refetching
- Selective cache invalidation

### DevTools
- React Query DevTools (development mode)
- Zustand DevTools integration
- State persistence for important data

## 🎮 Sẵn sàng sử dụng!

Tất cả stores và hooks đã được thiết lập sẵn sàng. Bạn có thể:

1. Import và sử dụng trong các component
2. Thay thế logic cũ từ từ
3. Tận dụng caching và optimistic updates
4. Sử dụng DevTools để debug

Xem `src/components/example-usage.tsx` để biết cách sử dụng cụ thể!
