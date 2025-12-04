'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestAudioButton() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayAudio = async () => {
    try {
      // Gọi API proxy hoặc Supabase Storage
      const res = await fetch('/api/proxy/audio?word=home&dialect=uk');
      if (!res.ok) throw new Error('Failed to fetch audio');

      const data = await res.json();
      const audioUrl = data.url;

      // Nếu đã có audio trước đó thì dừng
      if (audio) {
        audio.pause();
      }

      // Tạo AudioElement mới và phát
      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);
      await newAudio.play();
      console.log('Audio is playing...');
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  return <Button onClick={handlePlayAudio}>Play Audio</Button>;
}

