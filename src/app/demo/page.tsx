"use client"

import { useCurriculums, useCourses } from '@/hooks'
import { useUIStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function DemoPage() {
  // React Query hooks - tự động fetch data
  const { 
    data: curriculums = [], 
    isLoading: curriculumsLoading, 
    error: curriculumsError,
    refetch: refetchCurriculums 
  } = useCurriculums()
  
  const { 
    data: courses = [], 
    isLoading: coursesLoading,
    refetch: refetchCourses 
  } = useCourses()
  
  // Zustand store - quản lý UI state
  const { 
    isLoading: uiLoading, 
    error: uiError, 
    setLoading, 
    setError, 
    clearError,
    selectedItems,
    toggleItemSelection,
    clearSelection
  } = useUIStore()

  const handleTestError = () => {
    setError('Đây là test error từ Zustand store!')
  }

  const handleTestLoading = async () => {
    setLoading(true)
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  const handleRefreshData = () => {
    refetchCurriculums()
    refetchCourses()
  }

  const totalLoading = curriculumsLoading || coursesLoading || uiLoading

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Demo Zustand & React Query</h1>
      
      {/* Error Display */}
      {(curriculumsError || uiError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-red-700">
                {curriculumsError?.message || uiError}
              </div>
              <Button onClick={clearError} variant="outline" size="sm">
                Clear Error
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {totalLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-blue-700">
              🔄 Loading data...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button onClick={handleRefreshData}>
            🔄 Refresh Data
          </Button>
          <Button onClick={handleTestError} variant="destructive">
            ❌ Test Error
          </Button>
          <Button onClick={handleTestLoading} variant="secondary">
            ⏳ Test Loading
          </Button>
          <Button onClick={clearSelection} variant="outline">
            Clear Selection ({selectedItems.length})
          </Button>
        </CardContent>
      </Card>

      {/* Curriculums Data */}
      <Card>
        <CardHeader>
          <CardTitle>Curriculums ({curriculums.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {curriculums.length === 0 ? (
            <div className="text-gray-500">No curriculums found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculums.map((curriculum) => (
                <div
                  key={curriculum.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedItems.includes(curriculum.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleItemSelection(curriculum.id)}
                >
                  <h3 className="font-semibold">{curriculum.title}</h3>
                  <p className="text-sm text-gray-600">
                    ID: {curriculum.id.slice(0, 8)}...
                  </p>
                  {curriculum.levels && (
                    <p className="text-sm text-gray-500">
                      {curriculum.levels.length} levels
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Data */}
      <Card>
        <CardHeader>
          <CardTitle>Courses ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-gray-500">No courses found</div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{course.name}</h3>
                      <p className="text-sm text-gray-600">
                        Time: {course.estimatedTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        Words: {course.words?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {course.done}% Done
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Info */}
      {selectedItems.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-green-700">
              ✅ Selected {selectedItems.length} item(s): {selectedItems.join(', ').slice(0, 50)}...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
