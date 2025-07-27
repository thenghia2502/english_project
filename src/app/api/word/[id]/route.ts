import { NextRequest, NextResponse } from "next/server"
const words = [
       { id: "w1", word: "home", meaning: "nhà", ipa: "/həʊm/", selected: false, done: true, popularity: 1, belong: "" },
      { id: "w2", word: "school", meaning: "trường học", ipa: "/skuːl/", selected: false, done: false, popularity: 1, belong: "" },
      { id: "w3", word: "family", meaning: "gia đình", ipa: "/ˈfæməli/", selected: false, done: false, popularity: 1, belong: "" },
      { id: "w4", word: "friend", meaning: "bạn bè", ipa: "/frend/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w5", word: "water", meaning: "nước", ipa: "/ˈwɔːtər/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w6", word: "food", meaning: "thức ăn", ipa: "/fuːd/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w13", word: "chair", meaning: "ghế", ipa: "/tʃeə(r)/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w14", word: "table", meaning: "bàn", ipa: "/ˈteɪbl/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w15", word: "bed", meaning: "giường", ipa: "/bed/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w16", word: "door", meaning: "cửa", ipa: "/dɔː(r)/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w17", word: "window", meaning: "cửa sổ", ipa: "/ˈwɪndəʊ/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w18", word: "light", meaning: "ánh sáng", ipa: "/laɪt/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w19", word: "fan", meaning: "quạt", ipa: "/fæn/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w20", word: "pillow", meaning: "gối", ipa: "/ˈpɪləʊ/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w21", word: "blanket", meaning: "chăn", ipa: "/ˈblæŋkɪt/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w22", word: "shower", meaning: "vòi sen", ipa: "/ˈʃaʊə(r)/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w23", word: "toilet", meaning: "nhà vệ sinh", ipa: "/ˈtɔɪlət/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w24", word: "kitchen", meaning: "nhà bếp", ipa: "/ˈkɪtʃɪn/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w25", word: "cup", meaning: "cái cốc", ipa: "/kʌp/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w26", word: "plate", meaning: "đĩa", ipa: "/pleɪt/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w27", word: "spoon", meaning: "muỗng", ipa: "/spuːn/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w28", word: "fork", meaning: "nĩa", ipa: "/fɔːk/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w29", word: "knife", meaning: "dao", ipa: "/naɪf/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w30", word: "bottle", meaning: "chai", ipa: "/ˈbɒtl/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w7", word: "happy", meaning: "vui vẻ", ipa: "/ˈhæpi/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w8", word: "sad", meaning: "buồn", ipa: "/sæd/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w9", word: "angry", meaning: "tức giận", ipa: "/ˈæŋɡri/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w10", word: "excited", meaning: "phấn khích", ipa: "/ɪkˈsaɪtɪd/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w11", word: "tired", meaning: "mệt mỏi", ipa: "/ˈtaɪərd/", selected: false, done: false, popularity: 1, belong: "" },
      // { id: "w12", word: "nervous", meaning: "lo lắng", ipa: "/ˈnɜːrvəs/", selected: false, done: false, popularity: 1, belong: "" },
]    
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params // ✅ KHÔNG cần await ở đây!
   const word = words.find(w => w.id === id)

  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 })
  }

  return NextResponse.json(word)
}