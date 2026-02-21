import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle2, Circle } from "lucide-react"

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
]

export default function CurriculumTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Learning Curriculum</h2>
        <p className="text-muted-foreground">Follow our structured path from beginner to advanced</p>
      </div>

      <div className="space-y-6">
        {curriculum.map((unit) => (
          <Card key={unit.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{unit.unit}</CardTitle>
                  <CardDescription>{unit.description}</CardDescription>
                </div>
                <Badge variant="outline">
                  {unit.completed}/{unit.lessons} complete
                </Badge>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                  style={{ width: `${Math.round((unit.completed / unit.lessons) * 100)}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unit.modules.map((module, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    {module.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        module.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"
                      }`}
                    >
                      {module.title}
                    </span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 gap-2">
                Continue Unit <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
