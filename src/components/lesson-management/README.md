# Lesson Management Components

Bộ component được tách từ trang quản lý bài học để dễ hiểu, sửa chữa và cải tiến.

## Cấu trúc Components

### 1. **LessonManagementPage** (Main Component)
- **Mục đích**: Component chính orchestrate toàn bộ trang quản lý bài học
- **Trách nhiệm**: 
  - Quản lý state (sort, search, loading, error)
  - Fetch data từ API
  - Handle các actions (delete, edit, start learning)
  - Điều phối các component con

### 2. **TopNavigation**
- **Mục đích**: Navigation header cố định ở trên cùng
- **Trách nhiệm**: 
  - Hiển thị title
  - Nút chuyển đến trang quản lý giáo trình

### 3. **LessonSortFilter**
- **Mục đích**: Bộ lọc và sắp xếp bài học
- **Trách nhiệm**:
  - Search input để tìm kiếm theo tên bài học
  - Radio buttons để sắp xếp theo ngày tạo và tiến độ
  - Disable state khi không có kết quả tìm kiếm

### 4. **LessonCard**
- **Mục đích**: Card hiển thị thông tin một bài học
- **Trách nhiệm**:
  - Hiển thị thông tin chi tiết bài học (tên, số từ, thời gian, tiến độ)
  - Buttons cho các actions (delete, start learning, edit)
  - Visual states dựa trên progress

### 5. **LessonGrid**
- **Mục đích**: Container cho danh sách các lesson cards
- **Trách nhiệm**:
  - Render grid layout cho các lesson cards
  - Hiển thị empty state khi không có kết quả tìm kiếm

## Props Interface

### LessonSortFilterProps
```typescript
interface LessonSortFilterProps {
  sortBy: SortBy
  searchText: string
  onSortChange: (value: string) => void
  onSearchChange: (text: string) => void
  hasResults: boolean
}
```

### LessonCardProps
```typescript
interface LessonCardProps {
  lesson: Lesson
  onDelete: (lessonId: string) => Promise<void>
  onStartLearning: (lesson: Lesson) => void
  onEditLesson: (lesson: Lesson) => void
  formatDate: (dateString: string) => string
}
```

### TopNavigationProps
```typescript
interface TopNavigationProps {
  onNavigateToManagement: () => void
}
```

## Cách sử dụng

```typescript
import { LessonManagementPage } from "@/components/lesson-management"

export default function QuanLyBaiHocPage() {
  return <LessonManagementPage />
}
```

## Lợi ích của việc tách components

1. **Tách biệt trách nhiệm**: Mỗi component có một trách nhiệm rõ ràng
2. **Dễ test**: Có thể test từng component riêng biệt
3. **Tái sử dụng**: Các component như LessonCard có thể được dùng ở nơi khác
4. **Bảo trì**: Dễ dàng sửa đổi một phần cụ thể mà không ảnh hưởng toàn bộ
5. **Đọc hiểu**: Code structure rõ ràng, dễ hiểu hơn
6. **Collaboration**: Team có thể làm việc parallel trên các component khác nhau

## Các cải tiến có thể thực hiện

1. **Memoization**: Sử dụng `React.memo` cho các component con để tối ưu performance
2. **Custom hooks**: Tách logic sorting/filtering thành custom hooks
3. **Virtualization**: Sử dụng virtual scrolling cho danh sách lớn
4. **Error boundaries**: Thêm error boundaries cho từng component
5. **Loading states**: Skeleton loading cho từng component