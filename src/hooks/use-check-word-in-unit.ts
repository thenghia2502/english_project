import { useState } from "react"

interface CheckWordPayload {
    unitId: string
    wordId: string
}

interface CheckWordOptions<T> {
    onSuccess?: (data: T) => void | Promise<void>
}

interface UseCheckWordInUnitReturn<T> {
    isChecking: boolean
    error: string | null
    result: T | null
    checkWordInUnit: (payload: CheckWordPayload, options?: CheckWordOptions<T>) => Promise<T | null>
}

export function useCheckWordInUnit<T = unknown>(): UseCheckWordInUnitReturn<T> {
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<T | null>(null)

    const checkWordInUnit = async (payload: CheckWordPayload, options?: CheckWordOptions<T>): Promise<T | null> => {
        setIsChecking(true)
        setError(null)

        try {
            const res = await fetch('/api/proxy/words/check_word_in_unit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json() as T

            if (!res.ok) {
                const errorMessage = (data as unknown as { message?: string })?.message || `Failed to check word: ${res.statusText}`
                setError(errorMessage)
                return null
            }

            setResult(data)
            if (options?.onSuccess) {
                await options.onSuccess(data)
            }

            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
            setError(errorMessage)
            console.error('Error checking word in unit:', err)
            return null
        } finally {
            setIsChecking(false)
        }
    }

    return {
        isChecking,
        error,
        result,
        checkWordInUnit
    }
}
