'use client'
import { use } from "react"
import { BookReader } from "./bookReader"
import { useBookPage } from "./useStudentBookPage"
import Loading from '@/components/ui/loading'

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: bookId } = use(params)
    const { data: book, isLoading } = useBookPage(bookId)
    if (isLoading) {
        return (
            <Loading
                message="Đang tải sách..."
                variant="full-page"
                className='bg-white'
            />
        )
    }

    // if (!book) {
    //     return (
    //         <div className="flex h-screen items-center justify-center bg-white text-gray-900">
    //             <div className="text-center">
    //                 <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
    //                 <p className="text-muted-foreground">The book with ID &quot;{bookId}&quot; does not exist.</p>
    //             </div>
    //         </div>
    //     )
    // }

    const normalizedBook: {
        id: string
        name: string
        created_at: string
        updated_at: string
        description: string
        work_book_id: string
        units: { id: string, title: string, link: string }[]
    } = {
        id: book.id,
        name: book.name,
        created_at: book.created_at ?? '',
        updated_at: book.updated_at ?? '',
        description: book.description ?? '',
        work_book_id: book.work_book_id ?? '',
        units: book.units,
    }

    return <BookReader book={normalizedBook} />
}
