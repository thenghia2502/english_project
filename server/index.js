const express = require('express')
const path = require('path')
const fs = require('fs').promises
const app = express()
const port = process.env.PORT || 4000

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    
    next()
})

app.use(express.json())

// JSON parse error handler: catch body-parser/express.json syntax errors and return 400
// This prevents an unhandled exception stack trace when a client sends invalid JSON.
app.use((err, req, res, next) => {
    if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.warn('Invalid JSON payload received:', err.message)
        return res.status(400).json({ success: false, error: 'Invalid JSON payload', message: err.message })
    }
    // pass to next error handler
    next(err)
})

// Simple health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() })
})

// Serve the Next.js static build (if present)
const publicDir = path.join(__dirname, '..', 'out') // for next export
app.use(express.static(publicDir))

// Data file paths (prefer server-level files, fall back to src/lib)


// We'll resolve actual paths inside each handler to keep things simple

app.get('/api/lesson/:id', async (req, res) => {
    const { id } = req.params
    try {
        const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
        const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')

        let lessons = []
        let lessonWorks = []
        let works = []

        try { lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8')) } catch { }
        try { lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8')) } catch { }

        try {
            const resolvedWorksPath = await resolveWorksPath()
            if (resolvedWorksPath) works = JSON.parse(await fs.readFile(resolvedWorksPath, 'utf-8'))
        } catch { }

        const lesson = (lessons || []).find(c => c.id === id)
        if (!lesson) {
            return res.status(404).send('Lesson Not Found')
        }

        const links = (lessonWorks || []).filter(lw => lw.lesson_id === id)

        // Merge each lesson_work (lw) with its corresponding work (w). Keep all work keys
        // and add lesson_work fields (including lesson_work_id) so the client receives a
        // complete object containing both sources.
        const linksWithWork = links.map(lw => {
            const w = (works || []).find(x => x.id === lw.work_id) || {}
            return Object.assign({}, w, {
                lesson_work_id: lw.id,
                work_id: lw.work_id,
                pause_time: lw.pause_time,
                // keep both naming variants used elsewhere
                max_read: lw.max_read,
                maxRead: lw.max_read,
                show_ipa: lw.show_ipa,
                show_word: lw.show_word,
                show_ipa_and_word: lw.show_ipa_and_word,
                progress: lw.progress,
                reads_per_round: lw.reads_per_round
            })
        })

        return res.json(Object.assign({}, lesson, { words: linksWithWork }))
    } catch (err) {
        console.error('Error reading lesson data', err)
        return res.status(500).send('Server error')
    }
})

const data1Path = path.join(process.cwd(), "server", "curriculum_original.json")
app.get('/api/curriculum_original', async (req, res) => {
    try {
        const file = await fs.readFile(data1Path, "utf-8")
        const curriculum = JSON.parse(file)

        const levelsFile = path.join(process.cwd(), 'server', 'level.json')
        const unitsFile = path.join(process.cwd(), 'server', 'unit.json')
        let levels = []
        let units = []

        try {
            const lvRaw = await fs.readFile(levelsFile, 'utf-8')
            levels = JSON.parse(lvRaw)
        } catch { }

        try {
            const uRaw = await fs.readFile(unitsFile, 'utf-8')
            units = JSON.parse(uRaw)
        } catch { }

        // For each curriculum, attach list_level and list_unit (units from all levels) and their works
        let out = curriculum.map(item => {
            const itemLevels = (levels.filter(l => l.curriculum_original_id === item.id) || []).sort((a, b) => (a.order || 0) - (b.order || 0))
            const levelIds = itemLevels.map(l => l.id)

            const itemUnits = (units || []).filter(u => levelIds.includes(u.level_id)).map(u => {
                const wu = { id: u.id, name: u.name, level_id: u.level_id }
                // find work ids from unitWorks mapping
                return wu
            })
            return Object.assign({}, item, { list_level: itemLevels, list_unit: itemUnits })
        })

        // Apply search filter if search_text is provided
        let search_text = null
        if (req.query.search_text) {
            search_text = String(req.query.search_text).toLowerCase()
            out = out.filter(item => 
                item.name.toLowerCase().includes(search_text) || 
                (item.description && item.description.toLowerCase().includes(search_text))
            )
        }

        // Apply pagination query params: ?page=1&limit=16&search_text=''
        const page = Math.max(1, parseInt(req.query.page || '1', 10))
        const limit = Math.max(1, parseInt(req.query.limit || '16', 10))
        const total = out.length
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const start = (page - 1) * limit
        const items = out.slice(start, start + limit)

        res.json({ 
            success: true, 
            data: { 
                items, 
                total, 
                page, 
                limit, 
                totalPages 
            }, 
            message: 'Fetched curriculum data successfully' 
        })
    } catch (err) {
        console.error('Error reading curriculum data', err)
        res.status(500).send('Server error')
    }
})

app.get('/api/curriculum_original/:id', async (req, res) => {
    const { id } = req.params
    const file = await fs.readFile(data1Path, "utf-8")
    const curriculum = JSON.parse(file)
    const item = curriculum.find(c => c.id === id)

    if (item) {
        try {
            // Read levels and units so we can return the requested summarized shape
            const levelsFile = path.join(process.cwd(), 'server', 'level.json')
            const unitsFile = path.join(process.cwd(), 'server', 'unit.json')
            let levels = []
            let units = []
            try {
                const lvRaw = await fs.readFile(levelsFile, 'utf-8')
                levels = JSON.parse(lvRaw).filter(l => l.curriculum_original_id === id)
            } catch {
                // if levels file missing or parse error, keep levels empty
            }

            try {
                const uRaw = await fs.readFile(unitsFile, 'utf-8')
                units = JSON.parse(uRaw)
            } catch {
                // leave units empty on error
            }

            // list_level should be the levels array (sorted by order if present)
            const list_level = (levels || []).sort((a, b) => (a.order || 0) - (b.order || 0))

            // For list_unit, take units that belong to any of the levels in list_level
            const levelIds = list_level.map(l => l.id)
            const list_unit = (units || [])
                .filter(u => levelIds.includes(u.level_id))
                .map(u => ({ id: u.id, name: u.name, level_id: u.level_id }))

            const out = {
                id: item.id,
                name: item.name,
                description: item.description || '',
                list_level,
                list_unit: list_unit
            }

            res.json(out)
        } catch (err) {
            console.error('Error assembling curriculum summary', err)
            res.status(500).send('Server error')
        }
    } else {
        res.status(404).send('Curriculum Not Found')
    }
})

const data2Path = path.join(process.cwd(), "server", "curriculum_custom.json")
app.get('/api/curriculum_custom', async (req, res) => {
    try {
        const file = await fs.readFile(data2Path, "utf-8")
        const curriculum_custom = JSON.parse(file)

        const levelsFile = path.join(process.cwd(), 'server', 'level.json')
        const unitsFile = path.join(process.cwd(), 'server', 'unit.json')
        let levels = []
        let units = []
        try {
            const lvRaw = await fs.readFile(levelsFile, 'utf-8')
            levels = JSON.parse(lvRaw)
        } catch { }
        try {
            const uRaw = await fs.readFile(unitsFile, 'utf-8')
            units = JSON.parse(uRaw)
        } catch { }
        const ccuFile = path.join(process.cwd(), 'server', 'curriculum_custom_unit.json')
        let ccuList = []
        try {
            const ccuRaw = await fs.readFile(ccuFile, 'utf-8')
            ccuList = JSON.parse(ccuRaw)
        } catch { }
        let out = (curriculum_custom || []).map(item => {
            const itemLevels = (levels.filter(l => l.id === item.level_id) || []).sort((a, b) => (a.order || 0) - (b.order || 0))
            // const levelIds = itemLevels.map(l => l.id)
            // const itemUnits = (units || []).filter(u => levelIds.includes(u.level_id)).map(u => ({ id: u.id, name: u.name, level_id: u.level_id }))
            const itemUnits = ccuList.filter(ccu => ccu.curriculum_custom_id === item.id).map(ccu => units.find(u => u.id === ccu.unit_id)).map(u => ({ id: u.id, name: u.name, level_id: u.level_id }))
            return Object.assign({}, item, { list_level: itemLevels, list_unit: itemUnits })
        })

        // Apply pagination query params: ?page=1&limit=16
        let ccid = [] // filter by curriculum_original_id if provided
        if (req.query.curriculum_original_id) {
            ccid = Array.isArray(req.query.curriculum_original_id) ? req.query.curriculum_original_id : [req.query.curriculum_original_id]
        }
        if (ccid.length > 0) {
            // filter by the original curriculum id field (curriculum_original_id)
            out = out.filter(item => ccid.includes(item.curriculum_original_id))
        }
        let search_text = null
        if (req.query.search_text) {
            search_text = String(req.query.search_text).toLowerCase()
            out = out.filter(item => item.name.toLowerCase().includes(search_text) || (item.description && item.description.toLowerCase().includes(search_text)))
        }
        const page = Math.max(1, parseInt(req.query.page || '1', 10))
        const limit = Math.max(1, parseInt(req.query.limit || '12', 10))
        const total = out.length
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const start = (page - 1) * limit
        const items = out.slice(start, start + limit)

        res.json({ success: true, data: { items, total, page, limit, totalPages } })
    } catch (err) {
        console.error('Error reading curriculum_custom data', err)
        res.status(500).send('Server error')
    }
})

app.get('/api/curriculum_custom/:id', async (req, res) => {
    const { id } = req.params
    try {
        const curriculumCustomPath = path.join(process.cwd(), 'server', 'curriculum_custom.json')
        const curriculumCustom = JSON.parse(await fs.readFile(curriculumCustomPath, 'utf-8'))
        const item = curriculumCustom.find(i => i.id === id)
        if (item) {
            // Build list_level and list_unit for this custom curriculum
            const levelsFile = path.join(process.cwd(), 'server', 'level.json')
            const unitsFile = path.join(process.cwd(), 'server', 'unit.json')
            let levels = []
            let units = []
            try { levels = JSON.parse(await fs.readFile(levelsFile, 'utf-8')) } catch { }
            try { units = JSON.parse(await fs.readFile(unitsFile, 'utf-8')) } catch { }
            const ccuFile = path.join(process.cwd(), 'server', 'curriculum_custom_unit.json')
            let ccuList = []
            try {
                const ccuRaw = await fs.readFile(ccuFile, 'utf-8')
                ccuList = JSON.parse(ccuRaw)
            } catch { }
            const itemLevels = (levels.filter(l => l.id === item.level_id) || []).sort((a, b) => (a.order || 0) - (b.order || 0))
            const itemUnits = ccuList.filter(ccu => ccu.curriculum_custom_id === item.id).map(ccu => units.find(u => u.id === ccu.unit_id)).map(u => ({ id: u.id, name: u.name, level_id: u.level_id }))

            // attach level_name
            const levelById = (itemLevels || []).reduce((acc, l) => (acc[l.id] = l, acc), {})
            const itemUnitsWithLevel = itemUnits.map(u => Object.assign({}, u, { level_name: levelById[u.level_id] ? levelById[u.level_id].name : null }))

            // load works, unit_work mapping, lesson_work mapping, and lessons to attach list_work to each unit
            let works = []
            let unitWorks = []
            let lessonWorks = []
            let lessons = []
            try {
                const resolvedWorksPath = await resolveWorksPath()
                if (resolvedWorksPath) works = JSON.parse(await fs.readFile(resolvedWorksPath, 'utf-8'))
            } catch { }
            try {
                const serverUnitWork = path.join(process.cwd(), 'server', 'unit_work.json')
                const fallbackUnitWork = path.join(process.cwd(), 'src', 'lib', 'unit_work.json')
                const resolvedUnitWork = (await fileExists(serverUnitWork)) ? serverUnitWork : fallbackUnitWork
                unitWorks = JSON.parse(await fs.readFile(resolvedUnitWork, 'utf-8'))
            } catch { }
            try {
                const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')
                lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8'))
            } catch { }
            try {
                const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
                lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8'))
            } catch { }

            const itemUnitsWithWorks = itemUnitsWithLevel.map(u => {
                const workIds = (unitWorks || []).filter(uw => uw.unit_id === u.id).map(uw => uw.work_id)
                const list_word = (works || []).filter(w => workIds.includes(w.id)).map(w => {
                    // Tìm tất cả lesson_work records cho word này
                    const relatedLessonWorks = (lessonWorks || []).filter(lw => lw.work_id === w.id)
                    const lessonIds = []
                    const lessonNames = []
                    
                    relatedLessonWorks.forEach(lw => {
                        if (lw.lesson_id) {
                            const lesson = (lessons || []).find(ls => ls.id === lw.lesson_id)
                            if (lesson) {
                                lessonIds.push(lw.lesson_id)
                                lessonNames.push(lesson.name)
                            }
                        }
                    })
                    
                    return Object.assign({}, w, {
                        lesson_ids: lessonIds,
                        lesson_names: lessonNames
                    })
                })
                return Object.assign({}, u, { list_word })
            })

            const out = Object.assign({}, item, { list_level: itemLevels, list_unit: itemUnitsWithWorks })
            res.json(out)
        } else {
            res.status(404).send('Curriculum Not Found')
        }
    } catch (err) {
        console.error('Error reading curriculum_custom data', err)
        res.status(500).send('Server error')
    }
})
app.post('/api/curriculum_custom/create', async (req, res) => {
    try {
        // Expect payload: { id?, curriculum_original_id, name, description?, unitIds? }
        const payload = req.body || {}
        if (!payload.curriculum_original_id || !payload.name) {
            return res.status(400).json({ error: 'curriculum_original_id and name are required' })
        }

        // Read existing files
        const ccPath = path.join(process.cwd(), 'server', 'curriculum_custom.json')
        const ccuPath = path.join(process.cwd(), 'server', 'curriculum_custom_unit.json')
        let ccList = []
        let ccuList = []
        try {
            const ccRaw = await fs.readFile(ccPath, 'utf-8')
            ccList = JSON.parse(ccRaw)
        } catch { }
        try {
            const ccuRaw = await fs.readFile(ccuPath, 'utf-8')
            ccuList = JSON.parse(ccuRaw)
            // sanitize existing entries: ensure unit_id is stored as string id
            ccuList = ccuList.map(entry => {
                const raw = entry && entry.unit_id
                const uid = (typeof raw === 'string') ? raw : (raw && raw.id ? raw.id : String(raw))
                return Object.assign({}, entry, { unit_id: uid })
            })
        } catch { }

        // Create new curriculum_custom entry
        const now = new Date().toISOString()
        const newId = payload.id || `cc${Math.floor(Math.random() * 1000000)}`
        const newCC = Object.assign({
            id: newId,
            curriculum_original_id: payload.curriculum_original_id,
            level_id: payload.level_id || null,
            name: payload.name,
            description: payload.description || '',
            created_at: now,
            updated_at: now
        }, payload.extra || {})
        ccList.push(newCC)

        // Create curriculum_custom_unit entries for provided unitIds (if any)
        // Accept either array of ids (['u1']) or array of unit objects ([{id:'u1', name:'...'}])
        const unitIds = Array.isArray(payload.list_unit) ? payload.list_unit : []
        unitIds.forEach(rawUid => {
            // normalize to string id
            const uid = (typeof rawUid === 'string') ? rawUid : (rawUid && rawUid.id ? rawUid.id : String(rawUid))
            const ccuId = `ccu${Math.floor(Math.random() * 1000000)}`
            ccuList.push({ id: ccuId, curriculum_custom_id: newId, unit_id: uid })
        })

        // Persist files
        await fs.writeFile(ccPath, JSON.stringify(ccList, null, 2), 'utf-8')
        await fs.writeFile(ccuPath, JSON.stringify(ccuList, null, 2), 'utf-8')

        // Attach list_level and list_unit for response (reuse level/unit files)
        const levelsFile = path.join(process.cwd(), 'server', 'level.json')
        const unitsFile = path.join(process.cwd(), 'server', 'unit.json')
        let levels = []
        let units = []
        try { levels = JSON.parse(await fs.readFile(levelsFile, 'utf-8')) } catch { }
        try { units = JSON.parse(await fs.readFile(unitsFile, 'utf-8')) } catch { }

        const itemLevels = (levels.filter(l => l.curriculum_original_id === newCC.curriculum_original_id) || []).sort((a, b) => (a.order || 0) - (b.order || 0))
        const levelIds = itemLevels.map(l => l.id)
        const itemUnits = (units || []).filter(u => levelIds.includes(u.level_id)).map(u => ({ id: u.id, name: u.name }))

        const out = Object.assign({}, newCC, { list_level: itemLevels, list_unit: itemUnits })
        return res.status(201).json(out)
    } catch (err) {
        console.error('Error creating curriculum_custom', err)
        return res.status(500).send('Server error')
    }
})

app.put('/api/curriculum_custom/update', async (req, res) => {
    try {

        const payload = req.body || {}
        if (!payload.id) return res.status(400).json({ error: 'id is required' })

        const ccPath = path.join(process.cwd(), 'server', 'curriculum_custom.json')
        const ccuPath = path.join(process.cwd(), 'server', 'curriculum_custom_unit.json')
        let ccList = []
        let ccuList = []
        try { ccList = JSON.parse(await fs.readFile(ccPath, 'utf-8')) } catch { }
        try { ccuList = JSON.parse(await fs.readFile(ccuPath, 'utf-8')) } catch { }

        const idx = ccList.findIndex(x => x.id === payload.id)
        if (idx === -1) return res.status(404).json({ error: 'curriculum_custom not found' })

        // Update fields
        const now = new Date().toISOString()
        ccList[idx] = Object.assign({}, ccList[idx], {
            name: payload.name !== undefined ? payload.name : ccList[idx].name,
            description: payload.description !== undefined ? payload.description : ccList[idx].description,
            updated_at: now
        })

        // Update unit links: remove existing links for this curriculum_custom and add new ones
        const newUnitIds = Array.isArray(payload.list_unit) ? payload.list_unit : null
        if (newUnitIds !== null) {
            // remove existing
            ccuList = ccuList.filter(c => c.curriculum_custom_id !== payload.id)
            // add new (normalize ids if payload provides unit objects)
            newUnitIds.forEach(rawUid => {
                const uid = (typeof rawUid === 'string') ? rawUid : (rawUid && rawUid.id ? rawUid.id : String(rawUid))
                const ccuId = `ccu${Math.floor(Math.random() * 1000000)}`
                ccuList.push({ id: ccuId, curriculum_custom_id: payload.id, unit_id: uid })
            })
        }

        // Persist changes
        await fs.writeFile(ccPath, JSON.stringify(ccList, null, 2), 'utf-8')
        await fs.writeFile(ccuPath, JSON.stringify(ccuList, null, 2), 'utf-8')

        // Attach list_level and list_unit for response
        const levelsFile = path.join(process.cwd(), 'server', 'level.json')
        const unitsFile = path.join(process.cwd(), 'server', 'unit.json')

        let levels = []
        let units = []
        try { levels = JSON.parse(await fs.readFile(levelsFile, 'utf-8')) } catch { }
        try { units = JSON.parse(await fs.readFile(unitsFile, 'utf-8')) } catch { }

        const updated = ccList[idx]
        const itemLevels = (levels.filter(l => l.id === updated.level_id) || []).sort((a, b) => (a.order || 0) - (b.order || 0))
        const itemUnits = ccuList.filter(ccu => ccu.curriculum_custom_id === updated.id).map(ccu => units.find(u => u.id === ccu.unit_id)).map(u => ({ id: u.id, name: u.name, level_id: u.level_id }))

        const out = Object.assign({}, updated, { list_level: itemLevels, list_unit: itemUnits })
        return res.json(out)
    } catch (err) {
        console.error('Error updating curriculum_custom', err)
        return res.status(500).send('Server error')
    }
})

app.delete('/api/curriculum_custom/delete', async (req, res) => {
    try {
        // Accept id in body or query
        const id = (req.body && req.body.id) || req.query.id
        if (!id) return res.status(400).json({ error: 'id is required' })

        const ccPath = path.join(process.cwd(), 'server', 'curriculum_custom.json')
        const ccuPath = path.join(process.cwd(), 'server', 'curriculum_custom_unit.json')
        let ccList = []
        let ccuList = []
        try { ccList = JSON.parse(await fs.readFile(ccPath, 'utf-8')) } catch { }
        try { ccuList = JSON.parse(await fs.readFile(ccuPath, 'utf-8')) } catch { }

        const exists = ccList.some(x => x.id === id)
        if (!exists) return res.status(404).json({ error: 'curriculum_custom not found' })

        // Remove curriculum_custom
        ccList = ccList.filter(x => x.id !== id)
        // Remove associated unit links
        ccuList = ccuList.filter(x => x.curriculum_custom_id !== id)

        await fs.writeFile(ccPath, JSON.stringify(ccList, null, 2), 'utf-8')
        await fs.writeFile(ccuPath, JSON.stringify(ccuList, null, 2), 'utf-8')

        return res.status(200).json({ success: true, message: 'Deleted curriculum_custom successfully' })
    } catch (err) {
        console.error('Error deleting curriculum_custom', err)
        return res.status(500).send('Server error')
    }
})

app.post('/api/lesson/create', async (req, res) => {
    try {
        // Expect payload: { id?, curriculum_custom_id, name, order? }
        const payload = req.body || {}
        if (!payload.curriculum_custom_id || !payload.name) {
            return res.status(400).json({ error: 'curriculum_custom_id and name are required' })
        }

        const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
        let lessons = []
        try { lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8')) } catch { }

        const now = new Date().toISOString()
        const newId = payload.id || `ls${Math.floor(Math.random() * 1000000)}`
        const newLesson = Object.assign({
            id: newId,
            curriculum_custom_id: payload.curriculum_custom_id,
            curriculum_original_id: payload.curriculum_original_id || null,
            name: payload.name,
            order: payload.order || (lessons.length + 1),
            done: 0,
            created_at: now,
            updated_at: now
        }, payload.extra || {})

        lessons.push(newLesson)
        await fs.writeFile(lessonsPath, JSON.stringify(lessons, null, 2), 'utf-8')

        // Also create lesson_work entries if workIds provided
        const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')
        let lessonWorks = []
        try { lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8')) } catch { }
        const words = Array.isArray(payload.words) ? payload.words : []
        const createdLessonWorks = []
        words.forEach(word => {
            const lwId = `lw${Math.floor(Math.random() * 1000000)}`
            const lw = {
                id: lwId,
                lesson_id: newId,
                work_id: word.id,
                pause_time: word.pause_time,
                max_read: word.maxRead,
                show_ipa: word.show_ipa,
                show_word: word.show_word,
                show_ipa_and_word: word.show_ipa_and_word,
                reads_per_round: word.reads_per_round,
                progress: word.progress
            }
            lessonWorks.push(lw)
            createdLessonWorks.push(lw)
        })
        if (createdLessonWorks.length > 0) {
            await fs.writeFile(lessonWorkPath, JSON.stringify(lessonWorks, null, 2), 'utf-8')
        }

        return res.status(201).json(Object.assign({}, newLesson, { words: createdLessonWorks }))
    } catch (err) {
        console.error('Error creating lesson', err)
        return res.status(500).send('Server error')
    }
})

app.put('/api/lesson/update', async (req, res) => {
    try {
        const payload = req.body || {}
        if (!payload.id) return res.status(400).json({ error: 'id is required' })

        const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
        const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')
        let lessons = []
        let lessonWorks = []
        try { lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8')) } catch { }
        try { lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8')) } catch { }

        const idx = lessons.findIndex(l => l.id === payload.id)
        if (idx === -1) return res.status(404).json({ error: 'lesson not found' })

        const now = new Date().toISOString()
        lessons[idx] = Object.assign({}, lessons[idx], {
            name: payload.name !== undefined ? payload.name : lessons[idx].name,
            order: payload.order !== undefined ? payload.order : lessons[idx].order,
            done: payload.done !== undefined ? payload.done : lessons[idx].done,
            updated_at: now
        })

        // If works provided, replace lesson_work links for this lesson
        const newWords = Array.isArray(payload.words) ? payload.words : null
        if (newWords !== null) {
            lessonWorks = lessonWorks.filter(lw => lw.lesson_id !== payload.id)
            newWords.forEach(word => {
                const lwid = `lw${Math.floor(Math.random() * 1000000)}`
                lessonWorks.push(
                    {
                        id: lwid,
                        lesson_id: payload.id,
                        work_id: word.id,
                        pause_time: word.pause_time,
                        max_read: word.maxRead,
                        show_ipa: word.show_ipa,
                        show_word: word.show_word,
                        show_ipa_and_word: word.show_ipa_and_word,
                        reads_per_round: word.reads_per_round,
                        progress: word.progress
                    }
                )
            })
        }

        await fs.writeFile(lessonsPath, JSON.stringify(lessons, null, 2), 'utf-8')
        await fs.writeFile(lessonWorkPath, JSON.stringify(lessonWorks, null, 2), 'utf-8')

        // Return updated lesson with its lesson_works merged with work data
        const updated = lessons[idx]
        const lwLinks = lessonWorks.filter(l => l.lesson_id === updated.id)

        // Load works so we can merge fields
        let worksList = []
        try {
            const resolvedWorksPath = await resolveWorksPath()
            if (resolvedWorksPath) worksList = JSON.parse(await fs.readFile(resolvedWorksPath, 'utf-8'))
        } catch {
            // ignore
        }

        const merged = lwLinks.map(lw => {
            const w = (worksList || []).find(x => x.id === lw.work_id) || {}
            return Object.assign({}, w, {
                lesson_work_id: lw.id,
                work_id: lw.work_id,
                pause_time: lw.pause_time,
                max_read: lw.max_read,
                maxRead: lw.max_read,
                show_ipa: lw.show_ipa,
                show_word: lw.show_word,
                show_ipa_and_word: lw.show_ipa_and_word,
                progress: lw.progress,
                reads_per_round: lw.reads_per_round
            })
        })

        return res.json(Object.assign({}, updated, { words: merged }))
    } catch (err) {
        console.error('Error updating lesson', err)
        return res.status(500).send('Server error')
    }
})

app.delete('/api/lesson/delete', async (req, res) => {
    try {
        const id = (req.body && req.body.id) || req.query.id
        if (!id) return res.status(400).json({ error: 'id is required' })

        const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
        const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')
        let lessons = []
        let lessonWorks = []
        try { lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8')) } catch { }
        try { lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8')) } catch { }

        const exists = lessons.some(l => l.id === id)
        if (!exists) return res.status(404).json({ error: 'lesson not found' })

        lessons = lessons.filter(l => l.id !== id)
        lessonWorks = lessonWorks.filter(lw => lw.lesson_id !== id)

        await fs.writeFile(lessonsPath, JSON.stringify(lessons, null, 2), 'utf-8')
        await fs.writeFile(lessonWorkPath, JSON.stringify(lessonWorks, null, 2), 'utf-8')

        return res.status(200).json({ success: true, message: 'Deleted lesson successfully' })
    } catch (err) {
        console.error('Error deleting lesson', err)
        return res.status(500).send('Server error')
    }
})

app.get('/api/lesson', async (req, res) => {
    try {
        const lessonsPath = path.join(process.cwd(), 'server', 'lesson.json')
        const lessonWorkPath = path.join(process.cwd(), 'server', 'lesson_work.json')

        let lessons = []
        let lessonWorks = []
        let works = []

        try { lessons = JSON.parse(await fs.readFile(lessonsPath, 'utf-8')) } catch { }
        try { lessonWorks = JSON.parse(await fs.readFile(lessonWorkPath, 'utf-8')) } catch { }
        try {
            const resolvedWorksPath = await resolveWorksPath()
            if (resolvedWorksPath) works = JSON.parse(await fs.readFile(resolvedWorksPath, 'utf-8'))
        } catch { }

        const out = (lessons || []).map(lesson => {
            const links = (lessonWorks || []).filter(lw => lw.lesson_id === lesson.id)
            const linksWithWork = links.map(lw => (works.find(w => w.id === lw.work_id) || null))
            return Object.assign({}, lesson, { words: linksWithWork })
        })

        return res.json(out)
    } catch (err) {
        console.error('Error reading lessons data', err)
        return res.status(500).send('Server error')
    }
})

async function fileExists(p) {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

async function resolveWorksPath() {
    // check several likely filenames in order of preference
    const candidates = [
        path.join(process.cwd(), 'server', 'work.json'),
    ]
    for (const c of candidates) {
        if (await fileExists(c)) return c
    }
    return null
}

// API endpoint to save notes for a book
app.post('/api/notes/save', async (req, res) => {
    try {
        const payload = req.body || {}
        const { bookId, unitId, content } = payload

        if (!bookId) {
            return res.status(400).json({ 
                success: false, 
                error: 'bookId is required' 
            })
        }

        if (!unitId) {
            return res.status(400).json({ 
                success: false, 
                error: 'unitId is required' 
            })
        }

        if (content === undefined || content === null) {
            return res.status(400).json({ 
                success: false, 
                error: 'content is required' 
            })
        }

        // Create notes directory if it doesn't exist
        const notesDir = path.join(process.cwd(), 'server', 'notes')
        try {
            await fs.mkdir(notesDir, { recursive: true })
        } catch {
            // Directory might already exist, continue
        }

        // Save note to file named after bookId
        const noteFilePath = path.join(notesDir, `${bookId}.json`)
        const timestamp = new Date().toISOString()
        
        // Load existing notes for this book
        let bookNotes = {}
        try {
            const existing = await fs.readFile(noteFilePath, 'utf-8')
            bookNotes = JSON.parse(existing)
        } catch {
            // File doesn't exist yet, start fresh
        }

        // Update note for this specific unit
        bookNotes[unitId] = {
            content,
            lastUpdated: timestamp
        }

        await fs.writeFile(noteFilePath, JSON.stringify(bookNotes, null, 2), 'utf-8')

        return res.status(200).json({ 
            success: true, 
            message: 'Note saved successfully',
            data: {
                bookId,
                unitId,
                content,
                lastUpdated: timestamp
            }
        })
    } catch (err) {
        console.error('Error saving note', err)
        return res.status(500).json({ 
            success: false, 
            error: 'Server error while saving note' 
        })
    }
})

// API endpoint to get notes for a book
app.get('/api/notes/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params

        if (!bookId) {
            return res.status(400).json({ 
                success: false, 
                error: 'bookId is required' 
            })
        }

        const noteFilePath = path.join(process.cwd(), 'server', 'notes', `${bookId}.json`)
        
        // Check if note file exists
        const exists = await fileExists(noteFilePath)
        if (!exists) {
            return res.status(404).json({ 
                success: false, 
                message: 'No notes found for this book' 
            })
        }

        const noteContent = await fs.readFile(noteFilePath, 'utf-8')
        const bookNotes = JSON.parse(noteContent)

        return res.status(200).json({ 
            success: true, 
            data: bookNotes
        })
    } catch (err) {
        console.error('Error reading note', err)
        return res.status(500).json({ 
            success: false, 
            error: 'Server error while reading note' 
        })
    }
})

// API endpoint to get note for a specific unit
app.get('/api/notes/:bookId/:unitId', async (req, res) => {
    try {
        const { bookId, unitId } = req.params

        if (!bookId || !unitId) {
            return res.status(400).json({ 
                success: false, 
                error: 'bookId and unitId are required' 
            })
        }

        const noteFilePath = path.join(process.cwd(), 'server', 'notes', `${bookId}.json`)
        
        // Check if note file exists
        const exists = await fileExists(noteFilePath)
        if (!exists) {
            return res.status(404).json({ 
                success: false, 
                message: 'No notes found for this book' 
            })
        }

        const noteContent = await fs.readFile(noteFilePath, 'utf-8')
        const bookNotes = JSON.parse(noteContent)

        if (!bookNotes[unitId]) {
            return res.status(404).json({ 
                success: false, 
                message: 'No note found for this unit' 
            })
        }

        return res.status(200).json({ 
            success: true, 
            data: {
                bookId,
                unitId,
                ...bookNotes[unitId]
            }
        })
    } catch (err) {
        console.error('Error reading note', err)
        return res.status(500).json({ 
            success: false, 
            error: 'Server error while reading note' 
        })
    }
})

if (require.main === module) {
    app.listen(port, () => console.log(`Express server running on http://localhost:${port}`))
}

module.exports = app
