# Documentation - Quản lý Giáo trình

## Tổng quan
File `quanlygiaotrinh/page.tsx` là trang quản lý giáo trình với các tính năng:
- Hiển thị danh sách giáo trình gốc dạng carousel (1 hàng)
- Hiển thị danh sách bài học được nhóm theo giáo trình dạng carousel (2 hàng)
- Tính năng xóa giáo trình và danh sách bài học
- Navigation carousel với nút Previous/Next và dots indicator

## Interfaces

### Level
```typescript
interface Level {
    id: string
    name: string
    description?: string
    units?: Array<{
        id: string
        name: string
        content?: string
    }>
}
```

### Curriculum
```typescript
interface Curriculum {
    id: string
    title: string
    description?: string
    levels?: Level[]
    createdAt?: string
}
```

### LessonList
```typescript
interface LessonList {
    id: string
    name: string
    id_curriculum: string
    id_level: string
    list_exercise: string[]
}
```

## State Variables

### curriculums
- **Type**: `Curriculum[]`
- **Mục đích**: Lưu trữ danh sách tất cả giáo trình với thông tin chi tiết

### lessonLists
- **Type**: `LessonList[]`
- **Mục đích**: Lưu trữ danh sách tất cả bài học đã tạo từ các giáo trình

### isLoading
- **Type**: `boolean`
- **Mục đích**: Quản lý trạng thái loading khi fetch dữ liệu

### error
- **Type**: `string | null`
- **Mục đích**: Lưu trữ thông báo lỗi nếu có

### carouselIndices
- **Type**: `{[key: string]: number}`
- **Mục đích**: Lưu trữ index hiện tại của carousel cho từng giáo trình (lesson lists)

### curriculumCarouselIndex
- **Type**: `number`
- **Mục đích**: Lưu trữ index hiện tại của carousel giáo trình

## Utility Functions

### formatDate(dateString?: string)
**Mục đích**: Định dạng chuỗi ngày tháng thành định dạng tiếng Việt
**Tham số**: 
- `dateString`: Chuỗi ngày tháng ISO
**Trả về**: Chuỗi ngày tháng định dạng dd/mm/yyyy hoặc "Không rõ"
**Ví dụ**: 
```typescript
formatDate("2024-01-15T10:30:00Z") // "15/01/2024"
formatDate(undefined) // "Không rõ"
```

### getTotalUnits(levels?: Level[])
**Mục đích**: Tính tổng số units (bài học) trong tất cả levels của một giáo trình
**Tham số**: 
- `levels`: Mảng các level của giáo trình
**Trả về**: Tổng số units
**Logic**: Duyệt qua tất cả levels và cộng số lượng units trong mỗi level

### getTotalWords(levels?: Level[])
**Mục đích**: Ước tính tổng số từ vựng trong giáo trình
**Tham số**: 
- `levels`: Mảng các level của giáo trình
**Trả về**: Số từ ước tính (10 từ mỗi unit)
**Logic**: Lấy tổng số units nhân với 10

### getLessonsBycurriculum(curriculumId: string)
**Mục đích**: Lọc danh sách bài học theo curriculum ID
**Tham số**: 
- `curriculumId`: ID của giáo trình
**Trả về**: Mảng các danh sách bài học thuộc về giáo trình đó
**Logic**: Filter lessonLists theo id_curriculum

### getLevelName(curriculumId: string, levelId: string)
**Mục đích**: Lấy tên level dựa trên curriculum ID và level ID
**Tham số**: 
- `curriculumId`: ID của giáo trình
- `levelId`: ID của level
**Trả về**: Tên của level hoặc "Không rõ trình độ"
**Logic**: Tìm curriculum theo ID, sau đó tìm level trong curriculum đó

## CRUD Operations

### deleteCurriculum(curriculumId: string)
**Mục đích**: Xóa một giáo trình khỏi danh sách
**Tham số**: 
- `curriculumId`: ID của giáo trình cần xóa
**Logic**: 
1. Hiển thị confirm dialog
2. Filter curriculums để loại bỏ curriculum có ID tương ứng
3. Cập nhật state curriculums
**TODO**: Cần implement API delete thực tế

### deleteLessonList(lessonId: string)
**Mục đích**: Xóa một danh sách bài học thông qua API
**Tham số**: 
- `lessonId`: ID của danh sách bài học cần xóa
**Logic**: 
1. Hiển thị confirm dialog
2. Gọi API DELETE `/api/danhsachtu?id=${lessonId}`
3. Nếu thành công, cập nhật state lessonLists

## Carousel Functions - Lesson Lists

### getCarouselIndex(curriculumId: string)
**Mục đích**: Lấy index hiện tại của carousel cho một curriculum cụ thể
**Tham số**: 
- `curriculumId`: ID của giáo trình
**Trả về**: Index hiện tại hoặc 0 nếu chưa có
**Logic**: Truy cập object carouselIndices với key là curriculumId

### setCarouselIndex(curriculumId: string, index: number)
**Mục đích**: Cập nhật index carousel cho một curriculum cụ thể
**Tham số**: 
- `curriculumId`: ID của giáo trình
- `index`: Index mới cần set
**Logic**: Cập nhật carouselIndices object với key-value mới

### nextSlide(curriculumId: string, totalItems: number)
**Mục đích**: Chuyển đến trang tiếp theo của carousel lesson list
**Hiển thị**: Mỗi trang 6 items (2 hàng x 3 cột)
**Tham số**: 
- `curriculumId`: ID của giáo trình
- `totalItems`: Tổng số items trong danh sách
**Logic**: 
1. Tính currentPage từ index hiện tại (chia 6)
2. Tính totalPages từ totalItems
3. Tính nextPage (không vượt quá totalPages - 1)
4. Set index mới = nextPage * 6

### prevSlide(curriculumId: string)
**Mục đích**: Chuyển đến trang trước đó của carousel lesson list
**Tham số**: 
- `curriculumId`: ID của giáo trình
**Logic**: 
1. Tính currentPage từ index hiện tại
2. Tính prevPage (không nhỏ hơn 0)
3. Set index mới = prevPage * 6

## Carousel Functions - Curriculum List

### nextCurriculumSlide()
**Mục đích**: Chuyển đến trang tiếp theo của carousel curriculum
**Hiển thị**: Mỗi trang 3 items (1 hàng x 3 cột)
**Logic**: 
1. itemsPerPage = 3
2. Tính maxIndex = curriculums.length - itemsPerPage
3. Tính nextIndex (không vượt quá maxIndex)
4. Cập nhật curriculumCarouselIndex

### prevCurriculumSlide()
**Mục đích**: Chuyển đến trang trước đó của carousel curriculum
**Logic**: 
1. itemsPerPage = 3
2. Tính prevIndex (không nhỏ hơn 0)
3. Cập nhật curriculumCarouselIndex

## Data Fetching

### useEffect - Initial Data Load
**Mục đích**: Load dữ liệu ban đầu từ API
**APIs sử dụng**: 
- `/api/curriculum` - Danh sách curriculum cơ bản
- `/api/curriculum/[id]` - Chi tiết từng curriculum
- `/api/danhsachtu` - Danh sách lesson lists

**Logic**: 
1. Fetch parallel curriculum list và lesson lists
2. Validate data structure
3. Loop qua từng curriculum để fetch chi tiết
4. Xử lý error cho từng curriculum riêng biệt
5. Cập nhật state curriculums và lessonLists

**Error Handling**: 
- Nếu API call thất bại, trả về basic curriculum data
- Nếu toàn bộ process thất bại, set error state

## UI Components Structure

### Curriculum Carousel
- **Layout**: 1 hàng x 3 cột
- **Navigation**: Previous/Next buttons ẩn khi ở đầu/cuối
- **Dots**: Indicator cho số trang
- **Items per page**: 3

### Lesson Lists Carousel (per curriculum)
- **Layout**: 2 hàng x 3 cột = 6 items per page
- **Navigation**: Previous/Next buttons ẩn khi ở đầu/cuối
- **Dots**: Indicator cho số trang
- **Grouping**: Theo curriculum ID

### Navigation Logic
- **Previous button**: Ẩn khi ở trang đầu tiên
- **Next button**: Ẩn khi ở trang cuối cùng
- **Dots**: Click để jump đến trang cụ thể
- **Transform**: Sử dụng CSS translateX để slide

## Responsive Design
- **Mobile**: 1 cột
- **Tablet**: 2 cột
- **Desktop**: 3 cột
- **Grid**: Auto-adjust theo breakpoints của Tailwind CSS
