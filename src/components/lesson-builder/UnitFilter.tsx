"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface Unit {
    id: string
    name: string
}

interface UnitFilterProps {
    units: Unit[]
    selectedUnitIds: string[]
    setSelectedUnitIds: React.Dispatch<React.SetStateAction<string[]>>
}

export default function UnitFilter({ units, selectedUnitIds, setSelectedUnitIds }: UnitFilterProps) {
    return (
        <div className="mb-6">
            <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900">Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-5">
                        <div key={'all'} className="space-x-1 flex items-center text-gray-900">
                            <label htmlFor="all">Tất cả</label>
                            <Checkbox
                                id="all"
                                checked={selectedUnitIds.length === units.length && units.length > 0}
                                onCheckedChange={(checked) => {
                                    const enable = checked === true
                                    if (enable) {
                                        const allIds = units.map((u) => u.id)
                                        setSelectedUnitIds(allIds)
                                    } else {
                                        setSelectedUnitIds([])
                                    }
                                }}
                            />
                        </div>
                        {units.map((unit) => (
                            <div key={unit.id} className="space-x-1 flex items-center text-gray-900">
                                <label htmlFor={`bai${unit.id}`}>{unit.name}</label>
                                <Checkbox
                                    id={`bai${unit.id}`}
                                    checked={selectedUnitIds.includes(unit.id)}
                                    onCheckedChange={(checked) => {
                                        const enable = checked === true
                                        setSelectedUnitIds((prev) => {
                                            if (enable) {
                                                return Array.from(new Set([...prev, unit.id]))
                                            }
                                            return prev.filter((id) => id !== unit.id)
                                        })
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}