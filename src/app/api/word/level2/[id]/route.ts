import { NextRequest, NextResponse } from "next/server"

interface Word {
  id: string
  word: string
  meaning: string
  ipa: string
  selected: boolean
  done: boolean
  popularity: number
  belong: string
}

// ✅ Dữ liệu từ cấp 2
const level2Words: Record<string, Word[]> = {
  w1: [
    { id: "w1l21", word: "homeless", meaning: "vô gia cư", ipa: "/ˈhəʊmləs/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w1l22", word: "homework", meaning: "bài tập về nhà", ipa: "/ˈhəʊmwɜːk/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w2l21", word: "homemade", meaning: "tự làm ở nhà", ipa: "/ˌhəʊmˈmeɪd/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w2l22", word: "homecoming", meaning: "sự trở về nhà", ipa: "/ˈhəʊmˌkʌmɪŋ/", selected: false, done: false, popularity: 2, belong: "" }

  ],
  w2: [
    { id: "w2l21", word: "schoolbag", meaning: "cặp sách", ipa: "/ˈskuːlbæɡ/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w2l22", word: "school", meaning: "trường học", ipa: "/skuːl/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w3: [
    { id: "w3l21", word: "familial", meaning: "(thuộc) gia đình", ipa: "/fəˈmɪl.i.əl/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w4: [
    { id: "w4l21", word: "friendly", meaning: "thân thiện", ipa: "/ˈfrend.li/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w5: [
    { id: "w4l21", word: "happy", meaning: "vui vẻ, hạnh phúc", ipa: "/ˈhæp.i/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w6: [
    { id: "w4l21", word: "knowledgeable", meaning: "hiểu biết, có kiến thức", ipa: "/ˈnɒl.ɪ.dʒə.bəl/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w7: [
    { id: "w4l21", word: "beauty", meaning: "vẻ đẹp", ipa: "/ˈbjuː.ti/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w8: [
    { id: "w4l21", word: "wonderfully", meaning: "một cách tuyệt vời", ipa: "/ˈwʌn.də.fəl.i/", selected: false, done: false, popularity: 2, belong: "" }
  ],
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params // ví dụ: "w1l22"

  // ✅ Duyệt qua tất cả các mảng để tìm từ có id khớp
  let foundWord: Word | null = null

  for (const wordList of Object.values(level2Words)) {
    const match = wordList.find((w) => w.id === id)
    if (match) {
      foundWord = match
      break
    }
  }

  if (!foundWord) {
    return NextResponse.json(
      { message: "Không tìm thấy từ cấp 2 với ID này." },
      { status: 404 }
    )
  }

  return NextResponse.json(foundWord)
}

