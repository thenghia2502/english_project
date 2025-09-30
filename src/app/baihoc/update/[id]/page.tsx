import LessonBuilder from "@/components/lesson-builder/LessonBuilder"
export default function Page({ params }: { params: { id: string } }) {
    return <LessonBuilder mode="update" id={params.id} />
}