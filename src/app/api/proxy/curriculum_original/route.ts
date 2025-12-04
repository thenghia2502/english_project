// import z from 'zod';
// const curriculumListSchema = z.object({
//     items: z.array(z.object({
//         id: z.string(),
//         name: z.string(),
//         description: z.string(),
//         created_at: z.string().optional(),
//         updated_at: z.string().optional(),
//         list_level: z.array(z.object({
//             id: z.string().optional(),
//             curriculum_original_id: z.string().optional(),
//             name: z.string().optional(),
//             created_at: z.string().optional(),
//             updated_at: z.string().optional(),
//             order: z.number().optional(),
//         })).optional(),
//         list_unit: z.array(z.object({
//             id: z.string().optional(),
//             name: z.string().optional(),
//             level_id: z.string().optional(),
//         })).optional(),
//     })),
//     total: z.number(),
//     page: z.number(),
//     limit: z.number(),
//     totalPages: z.number(),
// });
// export async function GET(request: Request) {
//     try {
//         const url = new URL(request.url)
//         const search = url.search || ''
//         const outgoing = `http://localhost:4000/api/curriculum_original${search}`
//         const response = await fetch(outgoing, { cache: 'no-store' });
//         const raw = await response.json();

//         // Try common unwrap locations: raw, raw.data, raw.data.data
//         const candidates = [raw, raw?.data, raw?.data?.data];

//         // Try to find a candidate that matches the schema
//         for (const c of candidates) {
//             if (!c) continue
//             const parsed = curriculumListSchema.safeParse(c)
//             if (parsed.success) {
//                 return new Response(JSON.stringify(parsed.data), { status: 200, headers: { 'Cache-Control': 'no-store' } })
//             }
//         }

//         // If none matched, but raw is an array of items, wrap it
//         if (Array.isArray(raw)) {
//             const wrapped = {
//                 items: raw,
//                 total: raw.length,
//                 page: 1,
//                 limit: raw.length,
//                 totalPages: 1,
//             }
//             const parsed = curriculumListSchema.safeParse(wrapped)
//             if (parsed.success) return new Response(JSON.stringify(parsed.data), { status: 200, headers: { 'Cache-Control': 'no-store' } })
//         }

//         // If raw.items exists but no pagination metadata, build defaults
//         if (raw && Array.isArray(raw.items)) {
//             const wrapped = {
//                 items: raw.items,
//                 total: raw.total ?? raw.items.length,
//                 page: raw.page ?? 1,
//                 limit: raw.limit ?? raw.items.length,
//                 totalPages: raw.totalPages ?? Math.max(1, Math.ceil((raw.total ?? raw.items.length) / (raw.limit ?? raw.items.length))),
//             }
//             const parsed = curriculumListSchema.safeParse(wrapped)
//             if (parsed.success) return new Response(JSON.stringify(parsed.data), { status: 200, headers: { 'Cache-Control': 'no-store' } })
//         }

//         return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'Cache-Control': 'no-store' } })
//     } catch {
//         return new Response("Error in curriculum proxy endpoint:", { status: 500 });
//     }
// }

export async function GET() {
    try {
        // const url = new URL(request.url)
        // const search = url.search || ''
        const outgoing = `http://localhost:4000/curriculum`
        const response = await fetch(outgoing, { cache: 'no-store' });
        const raw = await response.json();
        return new Response(JSON.stringify(raw), { status: 200, headers: { 'Cache-Control': 'no-store' } })
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500 });
    }
}