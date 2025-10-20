import LessonBuilder from "@/components/lesson-builder/LessonBuilder";

export default async function UpdateLessonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <LessonBuilder id={id} mode="update" />;
}
