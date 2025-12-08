import { useRef, useState } from "react"
import { Unit, Word } from "@/lib/types"
import { LocalWord } from "@/components/lesson-builder/types"

interface ApiWordData {
    word_id: string
    word_text: string
    word_meaning?: string
    word_ipa?: string
    word_popularity?: number
    word_parent_id?: string | null
    children_count: number
}

interface ApiUnitData {
    unit_id: string
    unit_name: string
    unit_words: {
        original?: ApiWordData[]
        custom?: ApiWordData[]
    }
}

interface FetchUnitsResult {
    units: Unit[]
    initialData: { [key: string]: LocalWord[] }
}

export function useFetchUnitsByIds() {
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)
    const [unitsError, setUnitsError] = useState<string | null>(null)
    const [units, setUnits] = useState<Unit[]>([])
    const [initialData, setInitialData] = useState<{ [key: string]: LocalWord[] }>({})
    const lastUnitIdsRef = useRef<string[] | null>(null)

    const fetchUnitsByIds = async (unitIds: string[]): Promise<FetchUnitsResult> => {
        setIsLoadingUnits(true)
        setUnitsError(null)
        lastUnitIdsRef.current = unitIds

        const queryString = unitIds.map(id => `unitIds=${encodeURIComponent(String(id))}`).join('&')
        const response = await fetch(`/api/proxy/words/by_units?${queryString}`)
        if (!response.ok) {
            setIsLoadingUnits(false)
            const msg = 'Failed to fetch words'
            setUnitsError(msg)
            throw new Error(msg)
        }

        const result = await response.json()
        const wordsData = (result.success && result.data) ? result.data : (Array.isArray(result) ? result : [])

        if (!Array.isArray(wordsData) || wordsData.length === 0) {
            setIsLoadingUnits(false)
            const msg = 'No words data returned from API'
            setUnitsError(msg)
            throw new Error(msg)
        }

        const transformedUnits: Unit[] = []
        const initialDataLocal: { [key: string]: LocalWord[] } = {}

        wordsData.forEach((unitData: ApiUnitData) => {
            const root_original = (unitData.unit_words.original || []).map((w: ApiWordData): Word => ({
                word_id: w.word_id,
                word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                word_meaning: w.word_meaning || '-',
                word_ipa: w.word_ipa,
                word_popularity: w.word_popularity || 0,
                word_parent_id: undefined,
                children_count: w.children_count
            }))

            const root_custom = (unitData.unit_words.custom || []).map((w: ApiWordData): Word => ({
                word_id: w.word_id,
                word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                word_meaning: w.word_meaning || '-',
                word_ipa: w.word_ipa,
                word_popularity: w.word_popularity || 0,
                word_parent_id: undefined,
                children_count: w.children_count
            }))

            transformedUnits.push({
                unit_id: unitData.unit_id,
                unit_name: unitData.unit_name,
                unit_words: {
                    original: root_original,
                    custom: root_custom
                }
            })

            const list: LocalWord[] = []
            const originals = Array.isArray(unitData.unit_words.original) ? unitData.unit_words.original : []
            const customs = Array.isArray(unitData.unit_words.custom) ? unitData.unit_words.custom : []
            const allRoots: ApiWordData[] = [...originals, ...customs]

            allRoots.forEach((w: ApiWordData) => {
                list.push({
                    word_id: w.word_id,
                    word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                    word_meaning: w.word_meaning || '-',
                    word_ipa: w.word_ipa || '-',
                    word_popularity: w.word_popularity || 0,
                    word_parent_id: undefined,
                    selected: false,
                    done: false,
                    belong: '',
                    children_count: w.children_count
                })
            })

            const uniqueMap = new Map<string, LocalWord>()
            for (const lw of list) {
                if (!uniqueMap.has(lw.word_id)) uniqueMap.set(lw.word_id, lw)
            }
            initialDataLocal[unitData.unit_id] = Array.from(uniqueMap.values())
        })

        // store state for consumers who want automatic update after success
        setUnits(transformedUnits)
        setInitialData(initialDataLocal)
        setIsLoadingUnits(false)
        return { units: transformedUnits, initialData: initialDataLocal }
    }

    const refetchLast = async (): Promise<FetchUnitsResult | null> => {
        if (!lastUnitIdsRef.current) return null
        return fetchUnitsByIds(lastUnitIdsRef.current)
    }

    return { fetchUnitsByIds, isLoadingUnits, unitsError, units, initialData, refetchLast }
}
