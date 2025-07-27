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
    { id: "w1l22", word: "homework", meaning: "bài tập về nhà", ipa: "/ˈhəʊmwɜːk/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w2: [
    { id: "w2l21", word: "schoolbag", meaning: "cặp sách", ipa: "/ˈskuːlbæɡ/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w3: [
    { id: "w3l21", word: "familial", meaning: "(thuộc) gia đình", ipa: "/fəˈmɪl.i.əl/", selected: false, done: false, popularity: 2, belong: "" }
  ],
  w4: [
    { id: "w4l21", word: "friendly", meaning: "thân thiện", ipa: "/ˈfrend.li/", selected: false, done: false, popularity: 2, belong: "" }
  ],
}
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params

  const wordList = level2Words[id]

  if (!wordList) {
    return NextResponse.json({ message: "Không tìm thấy danh sách từ cấp 2 cho id này." }, { status: 404 })
  }

  return NextResponse.json(wordList)
}