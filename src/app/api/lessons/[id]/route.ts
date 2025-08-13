import { NextResponse } from "next/server";

type LessonUnit = {
  id: string;
  title: string;
  words: {
    id: string;
    word: string;
    meaning: string;
    ipa: string;
    selected: boolean;
    done: boolean;
    popularity: number;
    belong: string;
  }[];
};

const lessonsData: { [key: string]: LessonUnit[] } = {
  "56ac8013-487b-4257-80e1-f00b44b18ea1": [
    {
      id: "unit-1",
      title: "Introducing yourself",
      words: [
        { id: "w1", word: "home", meaning: "nhà", ipa: "/həʊm/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w2", word: "school", meaning: "trường học", ipa: "/skuːl/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w3", word: "family", meaning: "gia đình", ipa: "/ˈfæməli/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w4", word: "friend", meaning: "bạn bè", ipa: "/frend/", selected: false, done: false, popularity: 1, belong: "" },
      ],
    },
    {
      id: "unit-5",
      title: "Daily routines",
      words: [
        { id: "w5", word: "happiness", meaning: "hạnh phúc", ipa: "/ˈhæpɪnəs/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w6", word: "knowledge", meaning: "kiến thức", ipa: "/ˈnɒlɪdʒ/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w7", word: "beautiful", meaning: "đẹp", ipa: "/ˈbjuːtɪfəl/", selected: false, done: false, popularity: 1, belong: "" },
        { id: "w8", word: "wonderful", meaning: "tuyệt vời", ipa: "/ˈwʌndəfəl/", selected: false, done: false, popularity: 1, belong: "" },
      ],
    }
  ],
  // Lesson cho ID 88bbd3c4-82ac-4c56-8fdf-003be40ac023
  "88bbd3c4-82ac-4c56-8fdf-003be40ac023": [
    {
      id: "unit-advanced-1",
      title: "Advanced Vocabulary",
      words: [
        { id: "w9", word: "sophisticated", meaning: "tinh tế, phức tạp", ipa: "/səˈfɪstɪkeɪtɪd/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w10", word: "extraordinary", meaning: "phi thường", ipa: "/ɪkˈstrɔːdnri/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w11", word: "incredible", meaning: "không thể tin được", ipa: "/ɪnˈkredəbl/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w12", word: "magnificent", meaning: "tráng lệ", ipa: "/mæɡˈnɪfɪsnt/", selected: false, done: false, popularity: 2, belong: "" },
      ],
    },
    {
      id: "unit-advanced-2", 
      title: "Business English",
      words: [
        { id: "w13", word: "management", meaning: "quản lý", ipa: "/ˈmænɪdʒmənt/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w14", word: "strategy", meaning: "chiến lược", ipa: "/ˈstrætədʒi/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w15", word: "development", meaning: "phát triển", ipa: "/dɪˈveləpmənt/", selected: false, done: false, popularity: 2, belong: "" },
        { id: "w16", word: "innovation", meaning: "sự đổi mới", ipa: "/ˌɪnəˈveɪʃn/", selected: false, done: false, popularity: 2, belong: "" },
      ],
    }
  ],
  // Thêm một lesson test khác
  "test-lesson-id": [
    {
      id: "unit-test",
      title: "Bài test",
      words: [
        { id: "wt1", word: "test", meaning: "kiểm tra", ipa: "/test/", selected: false, done: false, popularity: 1, belong: "" },
      ],
    }
  ]
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    console.log('Requested lesson ID:', id);
    
    const lessonData = lessonsData[id];
    
    if (!lessonData) {
      console.log('Lesson not found for ID:', id);
      return NextResponse.json(
        { error: "Lesson not found" }, 
        { status: 404 }
      );
    }
    
    console.log('Returning lesson data:', lessonData);
    return NextResponse.json(lessonData);
  } catch (error) {
    console.error('Error in GET /api/lessons/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}