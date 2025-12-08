import { useState } from "react"

interface AddWordPayload {
    wordIds: string[]
    unitId: string
}

interface AddWordOptions {
    onSuccess?: () => void | Promise<void>
}

interface UseAddWordToUnitReturn {
    isLoading: boolean
    error: string | null
    addWordToUnit: (payload: AddWordPayload, options?: AddWordOptions) => Promise<boolean>
}

export const useAddWordToUnit = (): UseAddWordToUnitReturn => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addWordToUnit = async (payload: AddWordPayload, options?: AddWordOptions): Promise<boolean> => {
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/proxy/words/add_word_to_unit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) {
                const errorMessage = data?.message || `Failed to add word: ${res.statusText}`
                setError(errorMessage)
                return false
            }

            if (options?.onSuccess) {
                await options.onSuccess()
            }

            return true
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
            setError(errorMessage)
            console.error("Error adding word to unit:", err)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        isLoading,
        error,
        addWordToUnit
    }
}
