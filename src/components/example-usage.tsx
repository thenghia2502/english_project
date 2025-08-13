// Example usage of stores and queries in components
"use client"

import { useCurriculums, useCourses } from '@/hooks'
import { useUIStore, useCurriculumStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Curriculum } from '@/types'

export function ExampleUsage() {
  // Using React Query hooks
  const { data: curriculums, isLoading: curriculumsLoading, error: curriculumsError } = useCurriculums()
  const { data: courses, isLoading: coursesLoading } = useCourses()
  
  // Using Zustand stores
  const { isLoading, error, setLoading, setError, clearError } = useUIStore()
  const { selectedCurriculum, setSelectedCurriculum } = useCurriculumStore()

  const handleSelectCurriculum = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum)
  }

  const handleRefresh = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  if (curriculumsLoading || coursesLoading) {
    return <div>Loading...</div>
  }

  if (curriculumsError) {
    return <div>Error: {curriculumsError.message}</div>
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example Usage</h2>
      
      {/* Error display from Zustand */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <Button onClick={clearError} variant="outline" size="sm" className="ml-2">
            Clear
          </Button>
        </div>
      )}
      
      {/* Loading state from Zustand */}
      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Processing...
        </div>
      )}
      
      {/* Curriculums from React Query */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Curriculums ({curriculums?.length || 0})</h3>
        <div className="grid grid-cols-2 gap-2">
          {curriculums?.map((curriculum) => (
            <Button
              key={curriculum.id}
              variant={selectedCurriculum?.id === curriculum.id ? "default" : "outline"}
              onClick={() => handleSelectCurriculum(curriculum)}
            >
              {curriculum.title}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Courses from React Query */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Courses ({courses?.length || 0})</h3>
        <div className="space-y-1">
          {courses?.map((course) => (
            <div key={course.id} className="p-2 border rounded">
              <div className="font-medium">{course.name}</div>
              <div className="text-sm text-gray-600">
                Time: {course.estimatedTime} | Progress: {course.done}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleRefresh}>
          Refresh Data
        </Button>
        <Button 
          onClick={() => setError('This is a test error')} 
          variant="destructive"
        >
          Test Error
        </Button>
      </div>
      
      {/* Selected curriculum display */}
      {selectedCurriculum && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Selected: {selectedCurriculum.title}
        </div>
      )}
    </div>
  )
}
