import { useQuery } from '@tanstack/react-query';
import { Unit } from "@/lib/types";
import { LocalWord } from "@/components/lesson-builder/types";

interface ApiWordData {
    word_id: string;
    word_text: string;
    word_meaning?: string;
    word_ipa?: string;
    word_popularity?: number;
    word_parent_id?: string | null;
    children_count: number;
}

interface ApiUnitData {
    unit_id: string;
    unit_name: string;
    unit_order?: number;
    unit_words: ApiWordData[] | {
        original?: ApiWordData[];
        custom?: ApiWordData[];
    };
}

interface FetchUnitsResult {
    units: Unit[];
    initialData: { [key: string]: LocalWord[] };
}

const fetchUnitsByIds = async (unitIds: string[]): Promise<FetchUnitsResult> => {
    const queryString = unitIds.map(id => `unitIds=${encodeURIComponent(String(id))}`).join('&');
    const response = await fetch(`/api/proxy/words/by_units?${queryString}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch words');
    }

    const result = await response.json();
    const wordsData = (result.success && result.data) ? result.data : (Array.isArray(result) ? result : []);

    if (!Array.isArray(wordsData) || wordsData.length === 0) {
        throw new Error('No words data returned from API');
    }

    const transformedUnits: Unit[] = [];
    const initialDataLocal: { [key: string]: LocalWord[] } = {};

    wordsData.forEach((unitData: ApiUnitData) => {
        // Handle both array format (from /api/words/by_units) and object format (from backend)
        const unitWords = unitData.unit_words;
        const original: ApiWordData[] = Array.isArray(unitWords) 
            ? unitWords 
            : (unitWords.original || []);
        const custom: ApiWordData[] = Array.isArray(unitWords) 
            ? [] 
            : (unitWords.custom || []);

        const root_original = original.map((w: ApiWordData) => ({
            word_id: w.word_id,
            word_text: (w as any).word ?? w.word_text,
            word_meaning: w.word_meaning || '-',
            word_ipa: w.word_ipa,
            word_popularity: w.word_popularity || 0,
            word_parent_id: undefined,
            children_count: w.children_count
        }));

        const root_custom = custom.map((w: ApiWordData) => ({
            word_id: w.word_id,
            word_text: (w as any).word ?? w.word_text,
            word_meaning: w.word_meaning || '-',
            word_ipa: w.word_ipa,
            word_popularity: w.word_popularity || 0,
            word_parent_id: undefined,
            children_count: w.children_count
        }));

        transformedUnits.push({
            unit_id: unitData.unit_id,
            unit_name: unitData.unit_name,
            unit_words: {
                original: root_original,
                custom: root_custom
            }
        });

        const list: LocalWord[] = [];
        const allRoots: ApiWordData[] = [...original, ...custom];

        allRoots.forEach((w: ApiWordData) => {
            list.push({
                word_id: w.word_id,
                word_text: (w as any).word ?? w.word_text,
                word_meaning: w.word_meaning || '-',
                word_ipa: w.word_ipa || '-',
                word_popularity: w.word_popularity || 0,
                word_parent_id: undefined,
                selected: false,
                done: false,
                belong: '',
                children_count: w.children_count
            });
        });

        const uniqueMap = new Map<string, LocalWord>();
        for (const lw of list) {
            if (!uniqueMap.has(lw.word_id)) uniqueMap.set(lw.word_id, lw);
        }
        initialDataLocal[unitData.unit_id] = Array.from(uniqueMap.values());
    });

    return { units: transformedUnits, initialData: initialDataLocal };
};

export function useFetchUnitsByIdsQuery(unitIds: string[], enabled: boolean = true) {
    return useQuery({
        queryKey: ['units', unitIds],
        queryFn: () => fetchUnitsByIds(unitIds),
        enabled: enabled && unitIds.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    });
}
