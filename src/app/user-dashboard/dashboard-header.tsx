import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">LearnHub</h1>
            <p className="text-sm text-muted-foreground">Master English at Your Pace</p>
          </div>
        </div>
        <Button variant="outline" className="hidden sm:flex bg-transparent">
          Settings
        </Button>
      </div>
    </header>
  )
}
