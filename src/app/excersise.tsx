"use client";
import { useRef, useEffect } from "react";

interface Answer {
  pill: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  text: {
    x: number;
    y: number;
    value: string;
    size: number;
  };
}

interface WordSearchConfig {
  image: string;
  grid: { cellSize: number };
  answers: Answer[];
}

interface WordSearchProps {
  config: WordSearchConfig;
  spokenText?: string; // Text từ speech recognition
}

function replaceNumbersWithWords(text: string): string {
  const numberMap: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
  };
  return text.replace(/\b\d+\b/g, (match) => numberMap[match] || match);
}

export default function WordSearch({ config, spokenText = "" }: WordSearchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = config.image;
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // Responsive kích thước
      const container = canvas.parentElement;
      const displayWidth = container?.clientWidth || originalWidth;
      const ratio = displayWidth / originalWidth;

      canvas.width = displayWidth;
      canvas.height = originalHeight * ratio;

      // Vẽ ảnh nền
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Normalize spoken text để so sánh (lowercase, trim)
      const normalizedSpoken = replaceNumbersWithWords(spokenText.toLowerCase().trim().replace(/\.$/, ""));

      // ======== Vẽ tất cả các đáp án ========
      config.answers.forEach((ans) => {
        const { pill, text } = ans;

        // Kiểm tra xem text có khớp với spoken text không
        const isMatched = normalizedSpoken.includes(text.value.toLowerCase());

        // 🟣 Vẽ pill
        const pillX = (pill.x / originalWidth) * canvas.width;
        const pillY = (pill.y / originalHeight) * canvas.height;
        const pillW = (pill.width / originalWidth) * canvas.width;
        const pillH = (pill.height / originalHeight) * canvas.height;
        const pillR = (pill.radius / originalWidth) * canvas.width;



        // 🔵 Vẽ text trong pill (chỉ hiển thị nếu khớp)
        if (isMatched) {
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
          ctx.strokeStyle = "green";
          ctx.lineWidth = 3;
          ctx.stroke();

          const textX = (text.x / originalWidth) * canvas.width;
          const textY = (text.y / originalHeight) * canvas.height;
          ctx.font = `${text.size * ratio}px Arial`;
          ctx.fillStyle = "green";
          ctx.fillText(text.value, textX, textY);
        }
      });
    };
  }, [config, spokenText]); // Re-render khi spokenText thay đổi

  return (
    <div className="flex gap-4 bg-white text-black w-full">
      <canvas ref={canvasRef} className="border w-full" />
    </div>
  );
}
