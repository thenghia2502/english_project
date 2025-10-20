import { BookReader } from "./bookReader"

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
}
]

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: bookId } = await params
    const book = bookData.find((b) => b.id === bookId)

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

    return <BookReader book={book} />
}
