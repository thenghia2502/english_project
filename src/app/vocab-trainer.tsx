"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import audioData from "./data.json"
import audioDataLocal from './datalocal.json';
import { Input } from "@/components/ui/input"
// S3 Configuration - fallback if not found in data.json
const S3_BUCKET_URL = "https://your-vocab-bucket.s3.amazonaws.com/audio"
interface CourseWord {
  id: string
  word: string
  meaning: string
  ipa: string
  pauseTime: string
  maxReads: string // số lần đọc tối đa
  showIpa: string // số lần hiện IPA
  showWord: string // số lần hiện từ
  showIpaAndWord: string // số lần hiện IPA và từ
}
// Function to get audio URL for a word
const getAudioUrl = (word: string) => {
  // First check if the word exists in data.json
  const lowerWord = word.toLowerCase()
  if (lowerWord in audioData) {
    return audioData[lowerWord as keyof typeof audioData]
  }

  // If not found in data.json, use S3 fallback
  const cleanWord = lowerWord.replace(/[^a-z0-9]/g, "")
  return `${S3_BUCKET_URL}/${cleanWord}.mp3`
}

function getAudioUrlLocal(word: string): string | null {
  const data = audioDataLocal as Record<string, string>;
  return data[word] ?? null;
}

export default function VocabTrainer() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [vocabularyData, setVocabularyData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState("danh-sach-tu")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playCount, setPlayCount] = useState(25) // Default to show only IPA
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const maxPlayCount = 100
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track read counts for each word
  const [wordReadCounts, setWordReadCounts] = useState<number[]>([])
  const currentWord = vocabularyData[currentIndex]
  const [wordReadCountBefore, setWordReadCountBefore] = useState<number[]>([])
  const [wordReadCountAfter, setWordReadCountAfter] = useState<number[]>([])
  // const [pauseTime, setPauseTime] = useState<number>(0)
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
    })
    audioRef.current.addEventListener("error", () => {
      console.error("Audio playback error")
      setIsPlaying(false)
      setAudioError(true)
      setAudioLoading(false)
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current)
      }
    }
  }, [])

  // Load selected course from localStorage
  useEffect(() => {
    const savedCourse = localStorage.getItem("selectedCourse")

    if (savedCourse) {
      const course = JSON.parse(savedCourse)
      setSelectedCourse(course)
      // Transform course words to vocabulary data format
      const transformedData = course.words.map((word: any, index: number) => ({
        id: index + 1,
        word: word.word,
        ipa: word.ipa,
        meaning: word.meaning,
        example: `Example sentence for ${word.word}.`,
        pauseTime: word.pauseTime,
        audioUrl: getAudioUrlLocal(word.word),
        maxReads: Number.parseInt(word.maxReads) || 3, // Get maxReads from course
        showIpa: word.showIpa,
        showWord: word.showWord,
        showIpaAndWord: word.showIpaAndWord,
        progress: word.progress,
        readsPerRound: word.readsPerRound
      }))

      setVocabularyData(transformedData)
      // setPauseTime(Number(transformedData[1].pauseTime) * 1000)

      // Initialize read counts to 0 for all words
      setWordReadCounts(new Array(transformedData.length).fill(0))
      setWordReadCountBefore(new Array(transformedData.length).fill(0))
      setWordReadCountAfter(new Array(transformedData.length).fill(0))

    } else {
      // Use default data if no course selected
      const defaultData = [
        {
          id: 1,
          word: "home",
          ipa: "/həʊm/",
          meaning: "nhà",
          example: "I'm going home.",
          audioUrl: getAudioUrlLocal("home"),
          maxReads: 6,
          showIpa: 3,
          showWord: 2,
          showIpaAndWord: 1,
          progress: 0,
          readsPerRound: 3,
          pauseTime: 2,
        },
        {
          id: 2,
          word: "dog",
          ipa: "/dɒɡ/",
          meaning: "con chó",
          example: "The dog barked all night.",
          audioUrl: getAudioUrlLocal("dog"),
          maxReads: 6,
          showIpa: 3,
          showWord: 2,
          showIpaAndWord: 1,
          progress: 0,
          readsPerRound: 3,
          pauseTime: 2,
        },
      ]

      setVocabularyData(defaultData)
      setWordReadCounts(new Array(defaultData.length).fill(0))
      setWordReadCountBefore(new Array(defaultData.length).fill(0))
      setWordReadCountAfter(new Array(defaultData.length).fill(0))

    }
  }, [])
  const isForceStopRef = useRef(false)

  // Function to handle audio playback with auto-advance
  const handleAudioToggle = async () => {
    if (!audioRef.current || !currentWord) return

    if (isLooping) {
      console.log(`⏹️ Stopping auto-advance sequence`)

      // ✅ Dừng vòng lặp và đặt cờ dừng
      setIsLooping(false)
      setIsPlaying(false)
      isForceStopRef.current = true

      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current)
        loopTimeoutRef.current = null
      }

      audioRef.current.pause()
      audioRef.current.currentTime = 0
    } else {
      console.log(`🚀 Starting auto-advance sequence from word: "${currentWord.word}"`)
      // console.log(`📊 Current read counts:`, word.progress)

      isForceStopRef.current = false
      setIsLooping(true)
      setIsPlaying(true)
      playCurrentWord()
    }
  }

  const [lastPlayedWordId, setLastPlayedWordId] = useState<string | null>(null)

  const readsInCurrentRoundRef = useRef(0)

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  // Function to play current word
  // const playCurrentWord = async () => {
  //   if (!audioRef.current || !vocabularyData[currentIndex] || isForceStopRef.current) return;

  //   const wordToPlay = vocabularyData[currentIndex];
  //   const oldProgress = Number(wordToPlay.progress || 0);
  //   const newProgress = oldProgress + 1;
  //   const maxReads = wordToPlay.maxReads || 3;
  //   const readsPerRound = Number(wordToPlay.readsPerRound || 1);
  //   const pauseMs = Number(wordToPlay.pauseTime || 0) * 1000;

  //   // ✅ Chờ khoảng dừng trước khi đọc
  //   await delay(pauseMs);
  //   if (isForceStopRef.current) return;

  //   setAudioLoading(true);
  //   setAudioError(false);

  //   audioRef.current.src = wordToPlay.audioUrl || "";
  //   audioRef.current.currentTime = 0;

  //   audioRef.current.oncanplaythrough = async () => {
  //     if (isForceStopRef.current) return;
  //     try {
  //       await audioRef.current.play();
  //       setIsPlaying(true);
  //       setPlayCount((prev) => Math.min(prev + 1, maxPlayCount));
  //     } catch (error) {
  //       setAudioError(true);
  //       setIsLooping(false);
  //     } finally {
  //       setAudioLoading(false);
  //     }
  //   };

  //   audioRef.current.onerror = () => {
  //     setAudioLoading(false);
  //     setAudioError(true);
  //     setIsLooping(false);
  //   };

  //   audioRef.current.onloadeddata = () => {
  //     setAudioLoading(false);
  //   };

  //   audioRef.current.onended = async () => {
  //     if (isForceStopRef.current) return;
  //     setIsPlaying(false);

  //     // ✅ Tăng progress trong từ
  //     setVocabularyData((prev) => {
  //       const updated = [...prev];
  //       const current = updated[currentIndex];
  //       const old = Number(current.progress || 0);
  //       updated[currentIndex] = {
  //         ...current,
  //         progress: old + 1,
  //       };
  //       return updated;
  //     });

  //     const currentReadsInRound = readsInCurrentRoundRef.current + 1;

  //     if (currentReadsInRound >= readsPerRound) {
  //       readsInCurrentRoundRef.current = 0;
  //       await delay(pauseMs); // ⏳ nghỉ 2s
  //       if (!isForceStopRef.current) findNextWordToPlay();
  //     } else {
  //       readsInCurrentRoundRef.current = currentReadsInRound;
  //       // console.log(3)
  //       playCurrentWord(); // 🔁 lặp lại từ hiện tại
  //     }
  //   };
  // };
  // const playCurrentWord = async (indexToPlay: number = currentIndex) => {
  //   if (!audioRef.current || !vocabularyData[indexToPlay] || isForceStopRef.current) return;

  //   const wordToPlay = vocabularyData[indexToPlay];
  //   // const oldProgress = Number(wordToPlay.progress || 0);
  //   // const newProgress = oldProgress + 1;
  //   // const maxReads = wordToPlay.maxReads || 3;
  //   const readsPerRound = Number(wordToPlay.readsPerRound || 1);
  //   const pauseMs = Number(wordToPlay.pauseTime || 0) * 1000;

  //   await delay(pauseMs);
  //   if (isForceStopRef.current) return;

  //   setAudioLoading(true);
  //   setAudioError(false);

  //   audioRef.current.src = wordToPlay.audioUrl || "";
  //   audioRef.current.currentTime = 0;

  //   audioRef.current.oncanplaythrough = async () => {
  //     if (isForceStopRef.current) return;
  //     try {
  //       await audioRef.current.play();
  //       setIsPlaying(true);
  //       setPlayCount((prev) => Math.min(prev + 1, maxPlayCount));
  //     } catch (error) {
  //       setAudioError(true);
  //       setIsLooping(false);
  //     } finally {
  //       setAudioLoading(false);
  //     }
  //   };

  //   audioRef.current.onerror = () => {
  //     setAudioLoading(false);
  //     setAudioError(true);
  //     setIsLooping(false);
  //   };

  //   audioRef.current.onloadeddata = () => {
  //     setAudioLoading(false);
  //   };

  //   audioRef.current.onended = async () => {
  //     if (isForceStopRef.current) return;
  //     setIsPlaying(false);

  //     // Cập nhật progress
  //     // const newProgress = oldProgress + 1;
  //     setVocabularyData((prev) => {
  //       const updated = [...prev];
  //       const current = updated[indexToPlay];
  //       const realProgress = Number(current.progress || 0);
  //       updated[indexToPlay] = {
  //         ...current,
  //         progress: realProgress + 1, // ✅ dùng từ chính `prev`
  //       };
  //       return updated;
  //     });

  //     const currentReadsInRound = readsInCurrentRoundRef.current + 1;

  //     if (currentReadsInRound >= readsPerRound) {
  //       readsInCurrentRoundRef.current = 0;
  //       await delay(pauseMs);
  //       if (!isForceStopRef.current) findNextWordToPlay();
  //     } else {
  //       const progress = Number(wordToPlay.progress);
  //       const maxReads = Number(wordToPlay.maxReads);
  //       if (progress <= maxReads) {
  //         readsInCurrentRoundRef.current = currentReadsInRound;
  //         if (!isForceStopRef.current) forcePlayCurrentWord();
  //       }
  //     }
  //   };

  // };
  const playCurrentWord = async (indexToPlay: number = currentIndex) => {
    const wordToPlay = vocabularyData[indexToPlay];
    if (!audioRef.current || !wordToPlay || isForceStopRef.current) return;

    const progress = Number(wordToPlay.progress || 0);
    const maxReads = Number(wordToPlay.maxReads || 3);

    // ✅ Nếu đã maxReads thì KHÔNG phát nữa
    if (progress >= maxReads) {
      console.log(`⛔ [BỎ QUA PHÁT] "${wordToPlay.word}" đã đạt maxReads (${progress}/${maxReads})`);
      await onWordEnded();
      return;
    }

    console.log(`🎧 [PLAY] Từ: "${wordToPlay.word}" - Progress: ${progress}/${maxReads}`);

    const pauseMs = Number(wordToPlay.pauseTime || 0) * 1000;
    const readsPerRound = Number(wordToPlay.readsPerRound || 1);

    await delay(pauseMs);
    if (isForceStopRef.current) return;

    setAudioLoading(true);
    setAudioError(false);

    audioRef.current.src = wordToPlay.audioUrl || "";
    audioRef.current.currentTime = 0;

    audioRef.current.oncanplaythrough = async () => {
      if (isForceStopRef.current) return;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setPlayCount((prev) => Math.min(prev + 1, maxPlayCount));
        console.log(`▶️ [ĐANG PHÁT] "${wordToPlay.word}"`);
      } catch (error) {
        setAudioError(true);
        setIsLooping(false);
      } finally {
        setAudioLoading(false);
      }
    };

    audioRef.current.onerror = () => {
      setAudioLoading(false);
      setAudioError(true);
      setIsLooping(false);
    };

    audioRef.current.onloadeddata = () => {
      setAudioLoading(false);
    };

    audioRef.current.onended = async () => {
      if (isForceStopRef.current) return;
      setIsPlaying(false);

      await updateProgress(indexToPlay);
      await onWordEnded();
    };
  };


  // const updateProgress = async (index: number) => {
  //   setVocabularyData((prev) => {
  //     const updated = [...prev];
  //     const current = updated[index];
  //     const realProgress = Number(current.progress || 0);
  //     const newProgress = realProgress + 1;

  //     console.log(`📝 [CẬP NHẬT PROGRESS] "${current.word}": ${realProgress} ➡️ ${newProgress}`);

  //     updated[index] = {
  //       ...current,
  //       progress: newProgress,
  //     };
  //     return updated;
  //   });
  // };
  const updateProgress = async (index: number) => {
    setVocabularyData((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const realProgress = Number(current.progress || 0);
      const maxReads = Number(current.maxReads || 3);

      if (realProgress >= maxReads) {
        console.log(`⚠️ [SKIP] Không cập nhật "${current.word}" vì đã đạt maxReads`);
        return prev;
      }

      const newProgress = realProgress + 1;
      console.log(`📝 [CẬP NHẬT PROGRESS] "${current.word}": ${realProgress} ➡️ ${newProgress}`);

      updated[index] = {
        ...current,
        progress: newProgress,
      };

      // ✅ Cập nhật UI tracking
      setWordReadCountAfter((prevAfter) => {
        const updatedAfter = [...prevAfter];
        updatedAfter[index] = (updatedAfter[index] || 0) + 1;
        return updatedAfter;
      });

      return updated;
    });
  };

  const onWordEnded = async () => {
    const word = vocabularyData[currentIndex];
    const readsPerRound = Number(word.readsPerRound || 1);
    const pauseMs = Number(word.pauseTime || 0) * 1000;

    const currentReadsInRound = readsInCurrentRoundRef.current + 1;

    if (currentReadsInRound >= readsPerRound) {
      console.log(`🔄 [HOÀN VÒNG] "${word.word}" - nghỉ ${pauseMs}ms rồi tìm từ tiếp theo`);
      readsInCurrentRoundRef.current = 0;
      await delay(pauseMs);
      findNextWordToPlay();
    } else {
      readsInCurrentRoundRef.current = currentReadsInRound;

      const maxReads = Number(word.maxReads);
      const progress = Number(word.progress || 0);

      if (progress < maxReads && !isForceStopRef.current) {
        console.log(`🔁 [LẶP LẠI] "${word.word}" (${progress}/${maxReads}) - Lượt ${currentReadsInRound}/${readsPerRound}`);
        forcePlayCurrentWord();
      } else {
        console.log(`⛔ [KHÔNG LẶP] "${word.word}" đã đủ progress`);
        if (!isForceStopRef.current) {
          console.log(`🔍 [CHUYỂN] Không còn lượt lặp, tìm từ mới...`);
          findNextWordToPlay(); // ✅ Không còn lặp → tìm từ khác
        }
      }
    }
  };


  // Function to find next word that needs to be played
  // const findNextWordToPlay = () => {
  //   const totalWords = vocabularyData.length;
  //   if (totalWords === 0) return;

  //   const nextIndex = (currentIndex + 1);

  //   // 👉 1. Kiểm tra từ tiếp theo đến cuối mảng
  //   for (let i = nextIndex; i < totalWords; i++) {
  //     const word = vocabularyData[i];
  //     const readCount = Number(word.progress);
  //     const maxReads = Number(word.maxReads);
  //     if (readCount === maxReads) continue
  //     if (readCount < maxReads) {
  //       setCurrentIndex(i); // useEffect sẽ tự động gọi phát
  //       return;
  //     }
  //   }

  //   // 👉 2. Quay lại từ đầu đến trước currentIndex
  //   for (let i = 0; i < currentIndex; i++) {
  //     const word = vocabularyData[i];
  //     const readCount = Number(word.progress);
  //     const maxReads = Number(word.maxReads);
  //     if (readCount === maxReads) continue
  //     if (readCount < maxReads) {
  //       setCurrentIndex(i);
  //       return;
  //     }
  //   }

  //   // 👉 3. Không còn từ nào, lúc này MỚI kiểm tra từ hiện tại
  //   const currentWord = vocabularyData[currentIndex];
  //   const readCount = Number(currentWord.progress);
  //   const maxReads = Number(currentWord.maxReads);
  //   if (readCount >= maxReads) {
  //     console.log('rc: ',readCount)
  //     console.log('mr: ',maxReads)
  //     console.log("🛑 Tất cả các từ đã đạt maxReads. Dừng phát.");
  //     setIsLooping(false);
  //     setIsPlaying(false);
  //     setCurrentIndex(0);
  //     isForceStopRef.current = true; // ✅ CHẶN phát lại
  //     return;
  //   }

  //   // ✅ Nếu còn đọc được thì phát lại
  //   forcePlayCurrentWord();
  // };
  const findNextWordToPlay = () => {
    const totalWords = vocabularyData.length;
    if (totalWords === 0) return;

    const nextIndex = currentIndex + 1;

    for (let i = nextIndex; i < totalWords; i++) {
      const word = vocabularyData[i];
      if (Number(word.progress) < Number(word.maxReads)) {
        console.log(`➡️ [TÌM TỪ SAU] "${word.word}"`);
        setCurrentIndex(i);
        return;
      }
    }

    for (let i = 0; i < currentIndex; i++) {
      const word = vocabularyData[i];
      if (Number(word.progress) < Number(word.maxReads)) {
        console.log(`🔁 [QUAY LẠI ĐẦU] "${word.word}"`);
        setCurrentIndex(i);
        return;
      }
    }

    const current = vocabularyData[currentIndex];
    if (Number(current.progress) >= Number(current.maxReads)) {
      console.log(`🛑 [DỪNG] Tất cả các từ đã đạt maxReads.`);
      setIsLooping(false);
      setIsPlaying(false);
      isForceStopRef.current = true;
      setCurrentIndex(0);
    } else {
      console.log(`🔁 [LẶP LẠI HIỆN TẠI] "${current.word}"`);
      forcePlayCurrentWord();
    }
  };


  const [playTrigger, setPlayTrigger] = useState(0);

  const forcePlayCurrentWord = () => {
    setPlayTrigger((prev) => prev + 1);
  };

  //Effect to auto-play when currentIndex changes during looping
  useEffect(() => {
    if (!isForceStopRef.current) {
      // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.maxReads)
      // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.progress)
      playCurrentWord(currentIndex);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isForceStopRef.current) {
      // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.maxReads)
      // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.progress)
      playCurrentWord(currentIndex);
    }
  }, [playTrigger]);

  // Function to retry audio loading
  const handleRetryAudio = () => {
    setAudioError(false)
    setIsLooping(false)
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current)
      loopTimeoutRef.current = null
    }
    handleAudioToggle()
  }

  // Function to render vocabulary display based on playback count
  // const renderVocabularyDisplay = () => {
  //   const index = `${currentIndex + 1}.`
  //   const word = currentWord

  //   const readCount = wordReadCountAfter[currentIndex] || 0;


  //   const ipaRounds = Number(word.showIpa || 0)
  //   const wordRounds = Number(word.showWord || 0)
  //   const bothRounds = Number(word.showIpaAndWord || 0)

  //   // ✅ Tính điểm ranh giới giữa các phase
  //   const wordStart = ipaRounds
  //   const bothStart = ipaRounds + wordRounds

  //   let phase: 1 | 2 | 3 = 1
  //   if (readCount < wordStart) {
  //     phase = 1 // IPA
  //   } else if (readCount < bothStart) {
  //     phase = 2 // Word
  //   } else {
  //     phase = 3 // IPA + Word
  //   }
  //   // console.log('🔍 readCount:', readCount)
  //   // console.log('🔍 wordStart:', wordStart)
  //   // console.log('🔍 bothStart:', bothStart)
  //   // console.log('🔍 phase:', phase)

  //   // ✅ Hiển thị tương ứng
  //   if (phase === 1) {
  //     return (

  //       <span className="ipa-text text-[12rem] text-blue-600">{word.ipa}</span>

  //     )
  //   }

  //   if (phase === 2) {
  //     return (
  //       <span className="text-7xl text-gray-900">
  //         <span className="text-blue-600">{word.word}</span>
  //       </span>
  //     )
  //   }

  //   return (
  //     <span className="text-7xl font-semibold text-gray-900">
  //       <span className="text-blue-600">{word.word}</span>{" "}
  //       <span className="ipa-text text-blue-600 ml-2">{word.ipa}</span>
  //     </span>
  //   )
  // }
  const renderVocabularyDisplay = () => {
  const index = `${currentIndex + 1}.`;
  const word = currentWord;

  const readCount = Number(word.progress || 0); // ✅ dùng progress thay vì wordReadCount*

  const ipaRounds = Number(word.showIpa || 0);
  const wordRounds = Number(word.showWord || 0);
  const bothRounds = Number(word.showIpaAndWord || 0);

  const wordStart = ipaRounds;
  const bothStart = ipaRounds + wordRounds;

  let phase: 1 | 2 | 3 = 1;
  if (readCount <= wordStart) {
    phase = 1; // IPA
  } else if (readCount <= bothStart) {
    phase = 2; // Word
  } else {
    phase = 3; // IPA + Word
  }

  if (phase === 1) {
    return <span className="ipa-text text-[12rem] text-blue-600">{word.ipa}</span>;
  }
  if (phase === 2) {
    return (
      <span className="text-7xl text-gray-900">
        <span className="ipa-text text-[12rem] text-blue-600">{word.word}</span>
      </span>
    );
  }
  return (
    <span className="">
      <span className="ipa-text text-[12rem] text-blue-600">{word.word}</span>{" "}
      <span className="ipa-text text-[12rem] text-blue-600 ml-2">{word.ipa}</span>
    </span>
  );
};


  const [showName, setShowName] = useState('')
  const [showExample, setShowExample] = useState('')
  const handleShowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowName(e.target.checked ? e.target.value : '');
  };

  const handleShowExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowExample(e.target.checked ? e.target.value : '');
  };
  // Function to render flashcard content based on playback count
  const renderFlashcardContent = () => {
    const index = `${currentIndex + 1}.`
    const word = currentWord

    const readCount = Number(word.progress || 0); // ✅ dùng progress thay vì wordReadCount*

    const ipaRounds = Number(word.showIpa || 0)
    const wordRounds = Number(word.showWord || 0)
    const bothRounds = Number(word.showIpaAndWord || 0)

    // ✅ Tính điểm ranh giới giữa các phase
    const wordStart = ipaRounds
    const bothStart = ipaRounds + wordRounds

    let phase: 1 | 2 | 3 = 1
    if (readCount < wordStart) {
      phase = 1 // IPA
    } else if (readCount < bothStart) {
      phase = 2 // Word
    } else {
      phase = 3 // IPA + Word
    }

    return (
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Main word/IPA content */}
        <div className="text-center flex-1 flex ">
          {phase === 1 ? (
            <div className="space-y-4 flex-1 flex">
              <div className="flex-1 flex items-center justify-center">

                <span className="ipa-text text-blue-600 text-7xl">{word.ipa}</span>
              </div>
            </div>
          ) : phase === 2 ? (
            <div className="space-y-4 flex-1 flex">
              <div className="flex-1 flex items-center justify-center">

                <span className="text-blue-600 font-semibold text-7xl">{word.word}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex">
              <div className="flex-1 flex items-center justify-center">

                <span className="text-blue-600 font-semibold text-7xl">{word.word}</span>
                <span className="ipa-text text-blue-600 ml-2 text-7xl">{word.ipa}</span>
              </div>
            </div>
          )}
        </div>

        {/* Meaning */}
        {showName && showName === 'show-name' && (
          <div className="text-center flex-1 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Meaning</h3>
            <p className="text-xl font-bold text-blue-600">{word.meaning}</p>
          </div>
        )}

        {/* Example */}
        {showExample && showExample === 'show-example' && (
          <div className="text-center flex-1 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Example</h3>
            <p className="text-lg text-gray-700 italic">"{word.example}"</p>
          </div>
        )}
      </div>
    )
  }

  const changeCurrentWord = (direction: "prev" | "next") => {
    // Stop current audio and auto-advance
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current)
      loopTimeoutRef.current = null
    }

    setIsPlaying(false)
    setIsLooping(false)

    if (direction === "next") {
      setCurrentIndex((prev) => (prev + 1) % vocabularyData.length)
    } else {
      setCurrentIndex((prev) => (prev - 1 + vocabularyData.length) % vocabularyData.length)
    }
  }
  const updateCourseWord = (wordId: string, field: keyof CourseWord, value: string) => {
    // setCourseWords((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word)))
    setVocabularyData((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word)))
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCourse ? selectedCourse.name : "Vocab Trainer"}
            </h1>
          </div>
        </div>
      </nav>

      {vocabularyData.length > 0 ? (
        <main className="mx-auto min-h-[52rem] px-4 py-8 sm:px-6 lg:px-8 flex">
          <Card className="shadow-lg bg-white flex-1">
            <CardContent className="p-6 min-h-full">
              {/* Radio Button Controls */}
              <div className="mb-6 flex justify-between">
                <RadioGroup value={viewMode} onValueChange={setViewMode} className="flex flex-row space-x-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="danh-sach-tu" id="danh-sach-tu" />
                    <Label htmlFor="danh-sach-tu" className="text-sm font-medium cursor-pointer">
                      danh sách từ
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tu" id="tu" />
                    <Label htmlFor="tu" className="text-sm font-medium cursor-pointer">
                      từ
                    </Label>
                  </div>
                </RadioGroup>
                {viewMode === "tu" &&
                  <div className="flex space-x-6 p-2">
                    <div className="flex items-center space-x-2 ">
                      <input id="show-name" type="checkbox" name="show-name" value={"show-name"} checked={showName === "show-name"} onChange={handleShowNameChange} />
                      <label htmlFor="show-name" className="text-sm font-medium cursor-pointer" >hiện nghĩa</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input id="show-example" type="checkbox" name="show-example" value={"show-example"} checked={showExample === "show-example"} onChange={handleShowExampleChange} />
                      <label htmlFor="show-example" className="text-sm font-medium cursor-pointer"> hiện ví dụ</label>
                    </div>
                  </div>
                }
              </div>

              {/* Horizontal Display Row */}
              <div className="h-[46rem] mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4 min-h-[120px]">
                {/* Center: Vocabulary Display or Flashcard */}
                <div className="h-full w-full mx-4 md:mx-8 flex justify-center items-center">
                  {viewMode === "danh-sach-tu" ? (
                    // Plain text display for table view with 24px font size
                    <div className="">{renderVocabularyDisplay()}</div>
                  ) : (
                    // Single flashcard for word view - ONLY THIS, NO ADDITIONAL CONTENT
                    <div className="h-full w-full flex justify-center">
                      <Card className="bg-white shadow-lg border-0 w-full flex justify-center items-center">
                        <CardContent className="h-full w-full p-8 relative flex">
                          <div className="flex-1 flex">{renderFlashcardContent()}</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Right: Audio Control Button */}
                <div className="flex-shrink-0">
                  {audioError ? (
                    <div className="flex flex-col items-center">
                      <Button
                        onClick={handleRetryAudio}
                        className="px-6 py-2 rounded-full font-medium transition-all duration-200 bg-orange-500 h over:bg-orange-600 text-white"
                      >
                        Thử lại
                      </Button>
                      <div className="text-xs text-red-500 mt-1 text-center">Không tải được file âm thanh</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Button
                        className={`max-w-[100px] px-6 py-2 rounded-full font-medium transition-all duration-200 ${isLooping
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        onClick={handleAudioToggle}
                        disabled={audioLoading}
                      >
                        {isLooping ? "Dừng lại" : "Bắt đầu"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vocabulary Table - Only show when "danh sách từ" is selected */}
              {viewMode === "danh-sach-tu" && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 text-center font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Từ</TableHead>
                        <TableHead className="font-semibold">IPA</TableHead>
                        {/* <TableHead className="font-semibold">Nghĩa</TableHead> */}
                        <TableHead className="font-semibold">khoảng dừng</TableHead>
                        <TableHead className="font-semibold">Ví dụ</TableHead>
                        <TableHead className="font-semibold w-20 text-center">Đọc</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vocabularyData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`hover:bg-gray-100 transition-colors cursor-pointer ${index === currentIndex ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                            }`}
                        // onClick={() => {
                        //   setCurrentIndex(index)
                        //   if (isPlaying && audioRef.current) {
                        //     audioRef.current.pause()
                        //     audioRef.current.currentTime = 0
                        //     setIsPlaying(false)
                        //   }
                        // }}
                        >
                          <TableCell onClick={() => {
                            setCurrentIndex(index)
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.currentTime = 0
                              setIsPlaying(false)
                            }
                          }} className="text-center font-medium text-gray-600">{item.id}</TableCell>
                          <TableCell onClick={() => {
                            setCurrentIndex(index)
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.currentTime = 0
                              setIsPlaying(false)
                            }
                          }} className="font-semibold text-gray-900">{item.word}</TableCell>
                          <TableCell onClick={() => {
                            setCurrentIndex(index)
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.currentTime = 0
                              setIsPlaying(false)
                            }
                          }} className="text-gray-600 ipa-text text-sm">{item.ipa}</TableCell>
                          {/* <TableCell className="text-gray-700">{item.meaning}</TableCell> */}
                          <TableCell className="text-gray-600 italic flex items-center space-x-2">
                            <Input
                              id="pause-time"
                              type="number"
                              value={item.pauseTime}
                              onChange={(e) => updateCourseWord(item.id, "pauseTime", e.target.value)}
                              placeholder="0"
                              className="w-1/2 text-sm text-center"
                              min="0"
                            />
                            <span>
                              giây
                            </span>
                          </TableCell>
                          <TableCell onClick={() => {
                            setCurrentIndex(index)
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.currentTime = 0
                              setIsPlaying(false)
                            }
                          }} className="text-gray-600 italic">{item.example}</TableCell>
                          <TableCell onClick={() => {
                            setCurrentIndex(index)
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.currentTime = 0
                              setIsPlaying(false)
                            }
                          }} className="text-center">
                            <span
                              className={`text-sm font-medium ${(item.progress || 0) >= (item.maxReads || 3)
                                ? "text-green-600"
                                : "text-blue-600"
                                }`}
                            >
                              {item.progress || 0}/{item.maxReads || 3}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      ) : (
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Card className="shadow-lg bg-white">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400">
                <div className="text-5xl mb-4">📚</div>
                <p className="text-lg font-medium mb-2 text-gray-600">Chưa có khóa học nào được chọn</p>
                <p className="text-sm text-gray-500 mb-6">Vui lòng chọn một khóa học để bắt đầu học</p>
                <Button
                  onClick={() => (window.location.href = "/quanlykhoahoc")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Chọn khóa học
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
