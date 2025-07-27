import { NextResponse } from "next/server"
import { writeFileSync, existsSync } from "fs"
import { join } from "path"
import rawDanhsachtu from "@/lib/danhsachtu.json"
import rawCurriculum from "@/lib/curriculum.json"

interface Unit {
    id: string;
    name: string;
    content?: string;
}

interface Level {
    id: string;
    name: string;
    description?: string;
    units: Unit[];
}

interface Curriculum {
    id: string;
    title: string;
    description?: string;
    levels: Level[];
}

interface lesson {
    id: string; 
    name: string;
    id_curriculum: string;
    id_level: string;
    list_exercise: string[];
}

const danhsachtu: lesson[] = rawDanhsachtu as lesson[];
const curriculums: Curriculum[] = rawCurriculum as Curriculum[];

// Helper function to save data to file
function saveToFile(data: lesson[]) {
    const filePath = join(process.cwd(), 'src', 'lib', 'danhsachtu.json')
    
    // Create backup first
    if (existsSync(filePath)) {
        const backupPath = join(process.cwd(), 'src', 'lib', 'danhsachtu.backup.json')
        const currentData = JSON.stringify(danhsachtu, null, 2)
        writeFileSync(backupPath, currentData, 'utf8')
    }
    
    // Write new data
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}
export async function GET() {
    try {

        // Helper function to convert unit IDs to names
        const convertUnitIdsToNames = (lessonItem: lesson): lesson => {
            // Find the curriculum
            const curriculum = curriculums.find(c => c.id === lessonItem.id_curriculum);
            if (!curriculum) {
                console.warn(`Curriculum not found: ${lessonItem.id_curriculum}`);
                return lessonItem; // Return original if curriculum not found
            }

            // Find the level
            const level = curriculum.levels.find(l => l.id === lessonItem.id_level);
            if (!level) {
                console.warn(`Level not found: ${lessonItem.id_level} in curriculum ${lessonItem.id_curriculum}`);
                return lessonItem; // Return original if level not found
            }

            // Convert unit IDs to names
            const exerciseNames = lessonItem.list_exercise.map(unitId => {
                const unit = level.units.find(u => u.id === unitId);
                if (!unit) {
                    console.warn(`Unit not found: ${unitId} in level ${lessonItem.id_level}`);
                    return unitId; // Return original ID if unit not found
                }
                return unit.name;
            });

            return {
                ...lessonItem,
                list_exercise: exerciseNames
            };
        };

        // Convert all lesson items
        const convertedDanhsachtu = danhsachtu.map(convertUnitIdsToNames);

        return NextResponse.json(convertedDanhsachtu);
    } catch (error) {
        console.error("Error in GET /api/danhsachtu:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" }, 
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const newData: lesson = await req.json()
        
        // Validate required fields
        if (!newData.id || !newData.name || !newData.id_curriculum || !newData.id_level) {
            return NextResponse.json(
                { error: "Missing required fields: id, name, id_curriculum, id_level" }, 
                { status: 400 }
            )
        }
        
        // Check if ID already exists
        const existingItem = danhsachtu.find(item => item.id === newData.id)
        if (existingItem) {
            return NextResponse.json(
                { error: "ID already exists" }, 
                { status: 409 }
            )
        }
        
        // Add new data to array
        danhsachtu.push(newData)
        
        // Save to file
        saveToFile(danhsachtu)
        
        return NextResponse.json({ 
            message: "Data added successfully", 
            data: newData 
        }, { status: 201 })
        
    } catch (error) {
        console.error("Error in POST /api/danhsachtu:", error)
        return NextResponse.json(
            { error: "Failed to add data" }, 
            { status: 500 }
        )
    }
}

export async function PUT(req: Request) {
    try {
        const updateData: lesson = await req.json()
        
        // Validate required fields
        if (!updateData.id || !updateData.name || !updateData.id_curriculum || !updateData.id_level) {
            return NextResponse.json(
                { error: "Missing required fields: id, name, id_curriculum, id_level" }, 
                { status: 400 }
            )
        }
        
        // Find the item to update
        const index = danhsachtu.findIndex(item => item.id === updateData.id)
        if (index === -1) {
            return NextResponse.json(
                { error: "Item not found" }, 
                { status: 404 }
            )
        }
        
        // Update the item
        danhsachtu[index] = updateData
        
        // Save to file
        saveToFile(danhsachtu)
        
        return NextResponse.json({ 
            message: "Data updated successfully", 
            data: updateData 
        }, { status: 200 })
        
    } catch (error) {
        console.error("Error in PUT /api/danhsachtu:", error)
        return NextResponse.json(
            { error: "Failed to update data" }, 
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        
        if (!id) {
            return NextResponse.json(
                { error: "ID parameter is required" }, 
                { status: 400 }
            )
        }
        
        const index = danhsachtu.findIndex(item => item.id === id)
        
        if (index === -1) {
            return NextResponse.json(
                { error: "Item not found" }, 
                { status: 404 }
            )
        }
        
        // Remove item
        const deletedItem = danhsachtu.splice(index, 1)[0]
        
        // Save to file
        saveToFile(danhsachtu)
        
        return NextResponse.json({ 
            message: "Data deleted successfully", 
            data: deletedItem,
            totalRemaining: danhsachtu.length
        }, { status: 200 })
        
    } catch (error) {
        console.error("Error in DELETE /api/danhsachtu:", error)
        return NextResponse.json(
            { error: "Failed to delete data" }, 
            { status: 500 }
        )
    }
}
