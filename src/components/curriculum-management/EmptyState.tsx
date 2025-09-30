"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

interface EmptyStateProps {
    title: string
    description: string
    icon?: React.ComponentType<{ className?: string }>
}

export default function EmptyState({ 
    title, 
    description, 
    icon: Icon = BookOpen 
}: EmptyStateProps) {
    return (
        <div className="relative">
            <Card className="box-border bg-white border border-gray-200 shadow-sm w-full flex" style={{ minHeight: '332px' }}>
                <CardContent className="p-0 text-center flex flex-col justify-center flex-1">
                    <Icon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {title}
                    </h4>
                    <p className="text-xs text-gray-600">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}