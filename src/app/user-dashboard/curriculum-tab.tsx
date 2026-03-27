import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle2, Circle, Book, Menu, BookOpenText, EllipsisVertical, Search, ChevronFirst, ChevronLeft } from "lucide-react"
import { useCurriculumOriginalManagement } from "@/components/curriculum-original/useCurriculumOriginalManagement"
import { AppPagination } from "./pagination"
import { useRouter } from "next/navigation"

const curriculum = [
  {
    id: 1,
    unit: "Unit 1: Foundations",
    description: "Start your journey with English basics",
    lessons: 8,
    completed: 6,
    modules: [
      { title: "Alphabet & Pronunciation", completed: true },
      { title: "Basic Greetings", completed: true },
      { title: "Numbers & Dates", completed: true },
      { title: "Common Phrases", completed: true },
      { title: "Personal Pronouns", completed: false },
      { title: "Simple Questions", completed: false },
      { title: "Family & Relationships", completed: false },
      { title: "Unit 1 Review", completed: false },
    ],
  },
  {
    id: 2,
    unit: "Unit 2: Elementary",
    description: "Build your foundational skills",
    lessons: 10,
    completed: 3,
    modules: [
      { title: "Present Simple Tense", completed: true },
      { title: "Past Simple Tense", completed: true },
      { title: "Future Simple Tense", completed: true },
      { title: "Adjectives", completed: false },
      { title: "Prepositions", completed: false },
      { title: "Articles", completed: false },
      { title: "Imperatives", completed: false },
      { title: "Question Formation", completed: false },
      { title: "Negation", completed: false },
      { title: "Unit 2 Review", completed: false },
    ],
  },
  {
    id: 3,
    unit: "Unit 3: Intermediate",
    description: "Develop intermediate communication skills",
    lessons: 12,
    completed: 0,
    modules: [
      { title: "Present Perfect Tense", completed: false },
      { title: "Past Perfect Tense", completed: false },
      { title: "Conditionals", completed: false },
      { title: "Modals", completed: false },
      { title: "Passive Voice", completed: false },
      { title: "Relative Clauses", completed: false },
      { title: "Reported Speech", completed: false },
      { title: "Phrasal Verbs", completed: false },
      { title: "Advanced Vocabulary", completed: false },
      { title: "Business English", completed: false },
      { title: "Formal Writing", completed: false },
      { title: "Unit 3 Review", completed: false },
    ],
  },
  {
    id: 4,
    unit: "Unit 3: Intermediate",
    description: "Develop intermediate communication skills",
    lessons: 12,
    completed: 0,
    modules: [
      { title: "Present Perfect Tense", completed: false },
      { title: "Past Perfect Tense", completed: false },
      { title: "Conditionals", completed: false },
      { title: "Modals", completed: false },
      { title: "Passive Voice", completed: false },
      { title: "Relative Clauses", completed: false },
      { title: "Reported Speech", completed: false },
      { title: "Phrasal Verbs", completed: false },
      { title: "Advanced Vocabulary", completed: false },
      { title: "Business English", completed: false },
      { title: "Formal Writing", completed: false },
      { title: "Unit 3 Review", completed: false },
    ],
  },
  {
    id: 5,
    unit: "Unit 3: Intermediate",
    description: "Develop intermediate communication skills",
    lessons: 12,
    completed: 0,
    modules: [
      { title: "Present Perfect Tense", completed: false },
      { title: "Past Perfect Tense", completed: false },
      { title: "Conditionals", completed: false },
      { title: "Modals", completed: false },
      { title: "Passive Voice", completed: false },
      { title: "Relative Clauses", completed: false },
      { title: "Reported Speech", completed: false },
      { title: "Phrasal Verbs", completed: false },
      { title: "Advanced Vocabulary", completed: false },
      { title: "Business English", completed: false },
      { title: "Formal Writing", completed: false },
      { title: "Unit 3 Review", completed: false },
    ],
  },
  {
    id: 6,
    unit: "Unit 3: Intermediate",
    description: "Develop intermediate communication skills",
    lessons: 12,
    completed: 0,
    modules: [
      { title: "Present Perfect Tense", completed: false },
      { title: "Past Perfect Tense", completed: false },
      { title: "Conditionals", completed: false },
      { title: "Modals", completed: false },
      { title: "Passive Voice", completed: false },
      { title: "Relative Clauses", completed: false },
      { title: "Reported Speech", completed: false },
      { title: "Phrasal Verbs", completed: false },
      { title: "Advanced Vocabulary", completed: false },
      { title: "Business English", completed: false },
      { title: "Formal Writing", completed: false },
      { title: "Unit 3 Review", completed: false },
    ],
  },
]

export default function CurriculumTab() {
  const {
    isLoading,
    error,
    curriculums,
    stats,
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handleSearch,
    searchTerm
  } = useCurriculumOriginalManagement()

  const router = useRouter()
  const routerPush = (path: string) => {
    router.push(path)
  }
  return (
    <div className="">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Learning Curriculum</h2>
        <p className="text-muted-foreground">Follow our structured path from beginner to advanced</p>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curriculums.map((curriculum) => (
          <div key={curriculum.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-48 overflow-hidden">
              <img alt="React coding" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Computer screen showing modern react programming code" src="https://macpwgocrmlkwjjhhgzc.supabase.co/storage/v1/object/public/store2/image/Screenshot%202025-11-28%20101724.png" />
              {/* <div className="absolute top-4 right-4 flex gap-2">
                <span className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-full backdrop-blur-md border border-green-500/20">Published</span>
              </div> */}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {/* <p className="text-xs font-bold text-primary tracking-wider uppercase mb-1">CS-401</p> */}
                  <h3 className="text-lg font-bold leading-tight">{curriculum.name}</h3>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined"><EllipsisVertical /></span>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">Intermediate</span>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-base"><BookOpenText /></span>
                  <span>{curriculum.units.length} Lessons</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                {curriculum.description}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Created {curriculum.created_at}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 rounded-lg transition-colors" onClick={() => routerPush(`/lesson/create?id=${curriculum.id}`)}>Create Lesson</button>
                <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold py-2 rounded-lg transition-colors" onClick={() => routerPush(`/book/${curriculum.id}`)}>View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="">
          {totalPages >= 1 && (
            <AppPagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
