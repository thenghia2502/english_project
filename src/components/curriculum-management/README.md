# Curriculum Management Components

This directory contains modular React components for managing curriculums in the English learning application. The components are designed to be reusable, maintainable, and easy to understand.

## Components Overview

### Main Page Component
- **`CurriculumManagementPage.tsx`** - Main page component that orchestrates all curriculum management functionality

### Navigation & Layout
- **`TopNavigation.tsx`** - Navigation header for the curriculum management section
- **`SearchBar.tsx`** - Reusable search input component with icon
- **`EmptyState.tsx`** - Generic empty state component with customizable icon and text

### Curriculum Display
- **`CurriculumSection.tsx`** - Section for displaying original curriculums with search and carousel (legacy component)
- **`CurriculumFilter.tsx`** - Curriculum filtering interface with checkbox selection and "Select All" functionality
- **`CustomCurriculumList.tsx`** - Display and management of custom curriculums with pagination support

### Business Logic
- **`useCurriculumManagement.ts`** - Custom hook containing all business logic for curriculum management
- **`types.ts`** - TypeScript interface definitions for all components

## Key Features

### Original Curriculums
- **Search**: Real-time search filtering by name and description
- **Display**: Grid-based responsive layout
- **Filter**: Advanced filtering with multi-select checkboxes
- **Selection**: "Select All" functionality for bulk operations

### Custom Curriculums
- **CRUD Operations**: View and delete custom curriculums
- **Search**: Dedicated search for custom curriculums (name, description, course title)
- **Pagination**: Infinite scroll with "Load More" functionality
- **Empty States**: User-friendly empty state messaging

### State Management
- **Search States**: Separate search terms for original and custom curriculums
- **Filter States**: Selected curriculum IDs and filtered results
- **Loading States**: Loading indicators for async operations
- **Data Fetching**: React Query integration for server state management

## Usage Examples

### Using the Main Page Component
```tsx
import { CurriculumManagementPage } from '@/components/curriculum-management'

export default function CurriculumPage() {
    return <CurriculumManagementPage />
}
```

### Using Individual Components
```tsx
import { 
    CurriculumFilter, 
    CustomCurriculumList, 
    useCurriculumManagement 
} from '@/components/curriculum-management'

export function CustomCurriculumManager() {
    const {
        customCurriculums,
        isLoadingCustom,
        hasNextPage,
        handleLoadMore,
        handleViewCurriculum,
        handleDeleteCurriculum
    } = useCurriculumManagement()

    return (
        <CustomCurriculumList
            customCurriculums={customCurriculums}
            isLoading={isLoadingCustom}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
            onViewCurriculum={handleViewCurriculum}
            onDeleteCurriculum={handleDeleteCurriculum}
        />
    )
}
```

## Component Architecture

### Props Pattern
- Components use explicit prop interfaces for type safety
- Props are kept minimal and focused on component responsibility
- Callback props follow consistent naming (`onAction` pattern)

### State Management
- Business logic is centralized in `useCurriculumManagement` hook
- Components receive data and actions via props
- Local state is limited to UI-specific concerns

### Styling
- Tailwind CSS for consistent styling
- Responsive design patterns (grid layouts, mobile-first)
- Hover effects and transitions for better UX
- Consistent color scheme (gray-based with blue accents)

## TypeScript Integration

All components are fully typed with comprehensive interfaces:

```tsx
interface CurriculumFilterProps {
    curriculums: Curriculum[]
    selectedOriginalIds: string[] | undefined
    setSelectedOriginalIds: React.Dispatch<React.SetStateAction<string[] | undefined>>
    onApplyFilter: () => void
    onClearFilter: () => void
}
```

## Performance Considerations

- **Memoization**: `useMemo` for expensive computations and data transformations
- **Search Debouncing**: Real-time search with efficient filtering
- **Infinite Queries**: React Query for efficient data fetching and caching
- **Component Optimization**: Focused component responsibilities to minimize re-renders

## Integration Points

### Data Sources
- Original curriculums: Static/mock data (easily replaceable with API)
- Custom curriculums: React Query with pagination support
- Search filtering: Client-side filtering with server-side potential

### Navigation
- Router integration for navigation actions
- Support for programmatic navigation to curriculum details

### API Integration
- Ready for REST API integration
- React Query configuration for caching and synchronization
- Error handling patterns for failed requests

## Development Notes

### Mock Data
Currently uses mock data for demonstration:
- Original curriculums: 5 sample items with Vietnamese titles
- Custom curriculums: 3 sample items with creation dates and course associations

### Extensibility
- Easy to add new curriculum types
- Modular design allows for feature additions
- Hook pattern enables logic reuse across different pages

### Testing Strategy
- Components are designed for easy unit testing
- Business logic is isolated in custom hooks
- Mock data facilitates testing scenarios

## Migration Guide

To integrate these components into the existing QuanLyGiaoTrinh page:

1. **Replace existing page component**:
   ```tsx
   // Before: Large monolithic component
   // After: Import and use CurriculumManagementPage
   import { CurriculumManagementPage } from '@/components/curriculum-management'
   ```

2. **Update data integration**:
   - Replace mock data in `useCurriculumManagement` with actual API calls
   - Update interfaces to match your data structure
   - Configure React Query for your endpoints

3. **Customize styling**:
   - Modify Tailwind classes to match your design system
   - Update color scheme and spacing as needed
   - Adjust responsive breakpoints for your layout requirements