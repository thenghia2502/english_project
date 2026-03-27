'use client'
import { use } from "react"
import { BookReader } from "./bookReader"
import { useBookPage } from "./useBookPage"
import Loading from '@/components/ui/loading'

// Mock data - in production this would come from a database
const bookData = [{
    id: "english-grammar-in-use",
    title: "English Grammar in Use",
    author: "Raymond Murphy",
    units: [
        {
            id: "start",
            title: "Start: My family",
            pdfUrl: "https://drive.google.com/file/d/1OUwkeksSxSi4lEPapev4nquG2mGwGVRB/view?usp=drive_link",
            wb: ""
        },
        {
            id: "unit-1",
            title: "Unit 1: Present Simple",
            pdfUrl: "https://drive.google.com/file/d/1jpcSn3CQOj9giT9AKXVKM8NjZAtMpJ9s/view?usp=drive_link",
        },
        {
            id: "unit-2",
            title: "Unit 2: Present Continuous",
            pdfUrl: "https://drive.google.com/file/d/17Ia_ymJme08ykSxqi_77vWSSZ-KFmKw9/view?usp=drive_link",
        },
        {
            id: "unit-3",
            title: "Unit 3: Past Simple",
            pdfUrl: "https://drive.google.com/file/d/1vsu0sttChqp3K6vPqQox0An9Zq4lm8-2/view?usp=drive_link",
        },
        {
            id: "unit-4",
            title: "Unit 4: Past Continuous",
            pdfUrl: "https://drive.google.com/file/d/1CdDMz5s3u8eXUSzOxUR8if-w0tHC_To8/view?usp=drive_link",
        },
        {
            id: "unit-5",
            title: "Unit 5: Present Perfect",
            pdfUrl: "https://drive.google.com/file/d/1cOVg3fv69gUaMNbeqC-McZtRgBFBCWZX/view?usp=drive_link",
        },
        {
            id: "unit-6",
            title: "Unit 6: Future Simple",
            pdfUrl: "https://drive.google.com/file/d/1__Y1eyQwdnc_wMaK-fALfBJyfNB-tw6c/view?usp=drive_link",
        },
        {
            id: "unit-7",
            title: "Unit 7: Future Continuous",
            pdfUrl: "https://drive.google.com/file/d/1qHjUEiUlL15ZCA5u916g5l2LeFtPVUG0/view?usp=drive_link",
        },
        {
            id: "unit-8",
            title: "Unit 8: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1VJJwfXab2YJfi_bcaer0YgJHZ5zc1LbQ/view?usp=drive_link",
        },
        {
            id: "unit-9",
            title: "Unit 9: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1_VxatErTVi4yCIZsX-_A3j_SV_40KU9k/view?usp=drive_link",
        },
        {
            id: "unit-10",
            title: "Unit 10: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1rRyaZ8icVIlCEDbwkwBf6nMVFWYdBEN-/view?usp=drive_link",
        },
        {
            id: "unit-11",
            title: "Unit 11: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1Up6uM4kBNznMGhUcT9BCP6GhtZECZ3DQ/view?usp=drive_link",
        },
        {
            id: "unit-12",
            title: "Unit 12: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1eQxvxysq-pGLrW9_Ze95hqzhhCph5QUZ/view?usp=drive_link",
        },
        {
            id: "unit-13",
            title: "Unit 13: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1jIbpSMV1iq9jogAr3kOZ_hPnaFCgG5RH/view?usp=drive_link",
        },
        {
            id: "unit-14",
            title: "Unit 14: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1b9x7rAeRPiCxXYc8QESm1rjyT2pvZ93b/view?usp=drive_link",
        },
        {
            id: "unit-15",
            title: "Unit 15: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1m_z5DgUSeeBtGEWyLmzt0OjAvRZlHvO9/view?usp=drive_link",
        },
    ],
    id_wb: "english-grammar-in-use-wb"
},
{
    id: "english-grammar-in-use-2",
    title: "English Grammar in Use 2",
    author: "Raymond Murphy",
    units: [
        {
            id: "unit-1",
            title: "Unit 1: Present Simple",
            pdfUrl: "https://drive.google.com/file/d/1jpcSn3CQOj9giT9AKXVKM8NjZAtMpJ9s/view?usp=drive_link",
        },
        {
            id: "unit-2",
            title: "Unit 2: Present Continuous",
            pdfUrl: "https://drive.google.com/file/d/17Ia_ymJme08ykSxqi_77vWSSZ-KFmKw9/view?usp=drive_link",
        },
        {
            id: "unit-3",
            title: "Unit 3: Past Simple",
            pdfUrl: "https://drive.google.com/file/d/1vsu0sttChqp3K6vPqQox0An9Zq4lm8-2/view?usp=drive_link",
        },
        {
            id: "unit-4",
            title: "Unit 4: Past Continuous",
            pdfUrl: "https://drive.google.com/file/d/1CdDMz5s3u8eXUSzOxUR8if-w0tHC_To8/view?usp=drive_link",
        },
        {
            id: "unit-5",
            title: "Unit 5: Present Perfect",
            pdfUrl: "https://drive.google.com/file/d/1cOVg3fv69gUaMNbeqC-McZtRgBFBCWZX/view?usp=drive_link",
        },
        {
            id: "unit-6",
            title: "Unit 6: Future Simple",
            pdfUrl: "https://drive.google.com/file/d/1__Y1eyQwdnc_wMaK-fALfBJyfNB-tw6c/view?usp=drive_link",
        },
        {
            id: "unit-7",
            title: "Unit 7: Future Continuous",
            pdfUrl: "https://drive.google.com/file/d/1qHjUEiUlL15ZCA5u916g5l2LeFtPVUG0/view?usp=drive_link",
        },
        {
            id: "unit-8",
            title: "Unit 8: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1VJJwfXab2YJfi_bcaer0YgJHZ5zc1LbQ/view?usp=drive_link",
        },
        {
            id: "unit-9",
            title: "Unit 9: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1_VxatErTVi4yCIZsX-_A3j_SV_40KU9k/view?usp=drive_link",
        },
        {
            id: "unit-10",
            title: "Unit 10: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1rRyaZ8icVIlCEDbwkwBf6nMVFWYdBEN-/view?usp=drive_link",
        },
        {
            id: "unit-11",
            title: "Unit 11: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1Up6uM4kBNznMGhUcT9BCP6GhtZECZ3DQ/view?usp=drive_link",
        },
        {
            id: "unit-12",
            title: "Unit 12: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1eQxvxysq-pGLrW9_Ze95hqzhhCph5QUZ/view?usp=drive_link",
        },
        {
            id: "unit-13",
            title: "Unit 13: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1jIbpSMV1iq9jogAr3kOZ_hPnaFCgG5RH/view?usp=drive_link",
        },
        {
            id: "unit-14",
            title: "Unit 14: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1b9x7rAeRPiCxXYc8QESm1rjyT2pvZ93b/view?usp=drive_link",
        },
        {
            id: "unit-15",
            title: "Unit 15: Future Perfect",
            pdfUrl: "https://drive.google.com/file/d/1m_z5DgUSeeBtGEWyLmzt0OjAvRZlHvO9/view?usp=drive_link",
        },
    ],
    id_wb: "english-grammar-in-use-2-wb"
}
]

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
    
    if (!book) {
        return (
            <div className="flex h-screen items-center justify-center bg-white text-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
                    <p className="text-muted-foreground">The book with ID &quot;{bookId}&quot; does not exist.</p>
                </div>
            </div>
        )
    }

    const normalizedBook: Parameters<typeof BookReader>[0]['book'] = {
        id: book.id,
        name: book.name,
        created_at: book.created_at ?? '',
        updated_at: book.updated_at ?? '',
        description: book.description ?? '',
        units: Array.isArray(book.units)
            ? book.units.map((unit) => {
                const source = unit as unknown as { link?: string; pdfUrl?: string; pdf_url?: string }

                return {
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name,
                    unit_order: unit.unit_order ?? 0,
                    link: source.link ?? source.pdfUrl ?? source.pdf_url ?? '',
                    level_id: unit.level_id,
                    level_name: unit.level_name,
                    level_description: unit.level_description ?? '',
                    level_code: unit.level_code,
                }
            })
            : [],
        levels: Array.isArray(book.levels)
            ? book.levels.map((level) => ({
                level_id: level.level_id,
                level_code: level.level_code,
                level_name: level.level_name,
                level_description: level.level_description ?? '',
            }))
            : [],
    }

    return <BookReader book={normalizedBook} />
}
