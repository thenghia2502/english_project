import { NextResponse } from "next/server"

const words = [
    { id: "w1", word: "home", meaning: "nhà", pronunciation: "/həʊm/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w2", word: "school", meaning: "trường học", pronunciation: "/skuːl/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w3", word: "family", meaning: "gia đình", pronunciation: "/ˈfæməli/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w4", word: "friend", meaning: "bạn bè", pronunciation: "/frend/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w5", word: "water", meaning: "nước", pronunciation: "/ˈwɔːtər/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w6", word: "food", meaning: "thức ăn", pronunciation: "/fuːd/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w7", word: "book", meaning: "sách", pronunciation: "/bʊk/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w8", word: "pen", meaning: "bút", pronunciation: "/pen/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w9", word: "pencil", meaning: "bút chì", pronunciation: "/ˈpensl/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w10", word: "notebook", meaning: "vở", pronunciation: "/ˈnəʊtbʊk/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w11", word: "bag", meaning: "túi", pronunciation: "/bæɡ/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w12", word: "clock", meaning: "đồng hồ", pronunciation: "/klɒk/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w13", word: "chair", meaning: "ghế", pronunciation: "/tʃeə(r)/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w14", word: "table", meaning: "bàn", pronunciation: "/ˈteɪbl/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w15", word: "bed", meaning: "giường", pronunciation: "/bed/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w16", word: "door", meaning: "cửa", pronunciation: "/dɔː(r)/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w17", word: "window", meaning: "cửa sổ", pronunciation: "/ˈwɪndəʊ/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w18", word: "light", meaning: "ánh sáng", pronunciation: "/laɪt/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w19", word: "fan", meaning: "quạt", pronunciation: "/fæn/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w20", word: "pillow", meaning: "gối", pronunciation: "/ˈpɪləʊ/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w21", word: "blanket", meaning: "chăn", pronunciation: "/ˈblæŋkɪt/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w22", word: "shower", meaning: "vòi sen", pronunciation: "/ˈʃaʊə(r)/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w23", word: "toilet", meaning: "nhà vệ sinh", pronunciation: "/ˈtɔɪlət/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w24", word: "kitchen", meaning: "nhà bếp", pronunciation: "/ˈkɪtʃɪn/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w25", word: "cup", meaning: "cái cốc", pronunciation: "/kʌp/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w26", word: "plate", meaning: "đĩa", pronunciation: "/pleɪt/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w27", word: "spoon", meaning: "thìa", pronunciation: "/spuːn/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w28", word: "fork", meaning: "nĩa", pronunciation: "/fɔːk/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w29", word: "knife", meaning: "dao", pronunciation: "/naɪf/", audioUrl: "", example: "", level: "1", category: "" },
    { id: "w30", word: "bottle", meaning: "chai", pronunciation: "/ˈbɒtl/", audioUrl: "", example: "", level: "1", category: "" },

    // Level 2 words
    { id: "w1l21", word: "homeless", meaning: "vô gia cư", ipa: "/ˈhəʊmləs/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w1l22", word: "homework", meaning: "bài tập về nhà", ipa: "/ˈhəʊmwɜːk/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w1l23", word: "homemade", meaning: "tự làm ở nhà", ipa: "/ˌhəʊmˈmeɪd/", selected: false, done: false, popularity: 2, belong: "" },
    { id: "w1l24", word: "homecoming", meaning: "sự trở về nhà", ipa: "/ˈhəʊmˌkʌmɪŋ/", selected: false, done: false, popularity: 2, belong: "" }
]

export async function GET() {
    return NextResponse.json(words)
}
