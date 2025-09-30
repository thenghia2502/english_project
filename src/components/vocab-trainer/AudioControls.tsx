"use client"

import { Button } from "@/components/ui/button"

interface AudioControlsProps {
    isLooping: boolean
    isPageLoading: boolean
    isDialectChanging: boolean
    audioError: boolean
    vocabularyData: Array<{ progress: string; maxRead: string }>
    onAudioToggle: () => void
    onRetryAudio: () => void
}

export default function AudioControls({
    isLooping,
    isPageLoading,
    isDialectChanging,
    audioError,
    vocabularyData,
    onAudioToggle,
    onRetryAudio
}: AudioControlsProps) {
    if (audioError) {
        return (
            <div className="flex flex-col items-center">
                <Button
                    onClick={onRetryAudio}
                    className="px-6 py-2 rounded-full font-medium transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white"
                >
                    Thử lại
                </Button>
                <div className="text-xs text-red-500 mt-1 text-center">
                    Không tải được file âm thanh
                </div>
            </div>
        )
    }

    const isCompleted = vocabularyData.every(word => 
        Number(word.progress || 0) >= Number(word.maxRead || 3)
    )

    return (
        <div className="flex flex-col items-center">
            <Button
                className={`max-w-[100px] px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                    isPageLoading || isDialectChanging
                        ? "bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed"
                        : isLooping
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={onAudioToggle}
                disabled={isPageLoading || isDialectChanging}
            >
                {isDialectChanging 
                    ? "Đang chuyển..." 
                    : isLooping
                    ? "Dừng lại"
                    : isCompleted
                    ? "Bắt đầu lại"
                    : "Bắt đầu"
                }
            </Button>
        </div>
    )
}