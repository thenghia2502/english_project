'use client'

import React, { useEffect, useRef, useState } from 'react'

export default function AudioButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [count, setCount] = useState(0)
  const [displayState, setDisplayState] = useState<'ipa' | 'word' | 'ipa+word'>('ipa')
  const maxCount = 4

  // Hàm bắt đầu tự động phát audio
  const startAutoPlay = () => {
  if (count >= maxCount) return
  // người dùng click => được phép play
  audioRef.current?.play().catch((err) => {
    console.error("Không thể phát:", err)
  })
}


  // Khi audio kết thúc, tăng count để phát tiếp
  const handleAudioEnded = () => {
    setCount(prev => {
      const next = prev + 1
      return next
    })
  }

  // Khi count thay đổi, quyết định hiển thị và có phát tiếp hay không
  useEffect(() => {
  if (count === 0 || count >= maxCount) return

  const timer = setTimeout(() => {
    audioRef.current?.play().catch(err => {
      console.warn('Trình duyệt từ chối phát tự động:', err)
    })
  }, 500)

  return () => clearTimeout(timer)
}, [count])


  return (
    <div>
      <audio
        ref={audioRef}
        src="/audio/angry_amazon.mp3"
        onEnded={handleAudioEnded}
      />

      <button onClick={startAutoPlay} disabled={count >= maxCount}>
        {count === 0 ? 'Bắt đầu phát tự động' : 'Đang phát...'}
      </button>

      <div>Đã phát: {count} / {maxCount}</div>
      <div>
        {
          displayState === 'ipa' ? <div>ipa</div> :
          displayState === 'word' ? <div>word</div> :
          <div>ipa+word</div>
        }
      </div>
    </div>
  )
}
