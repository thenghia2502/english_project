interface CachedAudioUrl {
    url: string
    expiresAt: number // timestamp
}

class AudioUrlCache {
    private cache: Map<string, CachedAudioUrl> = new Map()
    private readonly EXPIRY_BUFFER = 30 * 1000 // Refresh 30s trước khi hết hạn

    getCacheKey(word: string, dialect: string): string {
        return `${word.toLowerCase()}_${dialect}`
    }

    set(word: string, dialect: string, url: string, expirySeconds: number = 60): void {
        const key = this.getCacheKey(word, dialect)
        const expiresAt = Date.now() + (expirySeconds * 1000)
        
        this.cache.set(key, { url, expiresAt })
        console.log(`🔵 Cached audio URL for "${word}" (${dialect}), expires in ${expirySeconds}s`)
    }

    get(word: string, dialect: string): string | null {
        const key = this.getCacheKey(word, dialect)
        const cached = this.cache.get(key)

        if (!cached) {
            return null
        }

        // Kiểm tra xem URL có sắp hết hạn không (trong vòng 30s)
        const willExpireSoon = cached.expiresAt - Date.now() < this.EXPIRY_BUFFER
        
        if (willExpireSoon) {
            console.log(`⚠️ Cached URL for "${word}" will expire soon, need refresh`)
            this.cache.delete(key)
            return null
        }

        console.log(`✅ Using cached audio URL for "${word}" (${dialect})`)
        return cached.url
    }

    clear(): void {
        this.cache.clear()
        console.log('🗑️ Audio URL cache cleared')
    }

    // Cleanup expired entries
    cleanup(): void {
        const now = Date.now()
        let count = 0
        
        for (const [key, value] of this.cache.entries()) {
            if (value.expiresAt <= now) {
                this.cache.delete(key)
                count++
            }
        }
        
        if (count > 0) {
            console.log(`🧹 Cleaned up ${count} expired audio URLs`)
        }
    }
}

// Singleton instance
const audioUrlCache = new AudioUrlCache()

// Cleanup expired URLs every 5 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        audioUrlCache.cleanup()
    }, 5 * 60 * 1000)
}

const getUrlAudio = async (word: string, dialect: string): Promise<string> => {
    // Kiểm tra cache trước
    const cachedUrl = audioUrlCache.get(word, dialect)
    if (cachedUrl) {
        return cachedUrl
    }

    // Fetch URL mới từ API
    console.log(`🌐 Fetching fresh audio URL for "${word}" (${dialect})`)
    const res = await fetch(`/api/proxy/audio?word=${encodeURIComponent(word)}&dialect=${dialect}`)
    
    if (!res.ok) {
        throw new Error(`Failed to fetch audio for "${word}": ${res.statusText}`)
    }
    
    const data = await res.json()
    const url = data.url

    // Cache URL với thời gian hết hạn (mặc định 60s, có thể lấy từ response nếu có)
    const expirySeconds = data.expiresIn || 60
    audioUrlCache.set(word, dialect, url, expirySeconds)

    return url
}

export const useGetUrlAudio = () => getUrlAudio

// Export cache instance để có thể clear khi cần
export const clearAudioCache = () => audioUrlCache.clear()