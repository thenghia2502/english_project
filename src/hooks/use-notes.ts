import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'

export interface NoteItem {
	id?: string
	idNote?: string
	title?: string
	content?: string
	[key: string]: unknown
}

export interface UpsertNotePayload {
	unitId: string
	content: string
}

interface ErrorResponseBody {
	message?: string | string[]
}

const getErrorMessage = (errorBody: ErrorResponseBody | null, fallback: string): string => {
	if (!errorBody?.message) return fallback
	if (Array.isArray(errorBody.message)) return errorBody.message.join(', ')
	return errorBody.message
}

const parseJsonSafe = async <T>(response: Response): Promise<T | null> => {
	const text = await response.text()
	if (!text) return null

	try {
		return JSON.parse(text) as T
	} catch {
		return null
	}
}

const fetchNoteById = async (idNote: string): Promise<NoteItem | null> => {
	const response = await apiFetch(`/api/proxy/note?idNote=${encodeURIComponent(idNote)}`)

	if (!response.ok) {
		const errorBody = await parseJsonSafe<ErrorResponseBody>(response)
		throw new Error(getErrorMessage(errorBody, 'Failed to fetch note'))
	}

	return parseJsonSafe<NoteItem>(response)
}

const upsertNote = async (payload: UpsertNotePayload): Promise<NoteItem | null> => {
	const response = await apiFetch('/api/proxy/note/upsert', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		const errorBody = await parseJsonSafe<ErrorResponseBody>(response)
		throw new Error(getErrorMessage(errorBody, 'Failed to upsert note'))
	}

	return parseJsonSafe<NoteItem>(response)
}

const deleteNoteById = async (idNote: string): Promise<unknown> => {
	const response = await apiFetch(`/api/proxy/note/delete?idNote=${encodeURIComponent(idNote)}`, {
		method: 'DELETE',
	})

	if (!response.ok) {
		const errorBody = await parseJsonSafe<ErrorResponseBody>(response)
		throw new Error(getErrorMessage(errorBody, 'Failed to delete note'))
	}

	return parseJsonSafe<unknown>(response)
}

export const noteKeys = {
	all: ['notes'] as const,
	details: () => [...noteKeys.all, 'detail'] as const,
	detail: (idNote: string) => [...noteKeys.details(), idNote] as const,
}

export const useNote = (idNote?: string | null) => {
	const queryKey = idNote ? noteKeys.detail(idNote) : noteKeys.details()

	return useQuery({
		queryKey,
		queryFn: () => (idNote ? fetchNoteById(idNote) : Promise.resolve(null)),
		enabled: !!idNote,
	})
}

export const useUpsertNote = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: upsertNote,
		onSuccess: async (data, variables) => {
			const keyFromPayload = variables.unitId
			const keyFromResponse =
				typeof data?.idNote === 'string' ? data.idNote : typeof data?.id === 'string' ? data.id : undefined

			const idNote = keyFromPayload || keyFromResponse

			if (idNote) {
				queryClient.setQueryData(noteKeys.detail(idNote), data)
			}

			await queryClient.invalidateQueries({ queryKey: noteKeys.all, refetchType: 'all' })
		},
	})
}

export const useDeleteNote = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteNoteById,
		onSuccess: async (_, idNote) => {
			queryClient.removeQueries({ queryKey: noteKeys.detail(idNote) })
			await queryClient.invalidateQueries({ queryKey: noteKeys.all, refetchType: 'all' })
		},
	})
}
