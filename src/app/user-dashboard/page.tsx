"use client"

import { useEffect, useState } from "react"
import LessonsTab from "./lessons-tab"
import CurriculumTab from "./curriculum-tab"
import UserInfoTab from "./user-info-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ClipboardList, User } from "lucide-react"
import DashboardHeader from "./dashboard-header"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const DASHBOARD_TABS = ["lessons", "curriculum", "profile"] as const
type DashboardTab = (typeof DASHBOARD_TABS)[number]
const DASHBOARD_TAB_STORAGE_KEY = "user-dashboard-active-tab"

function isDashboardTab(value: string | null): value is DashboardTab {
  return value !== null && DASHBOARD_TABS.includes(value as DashboardTab)
}

export default function Dashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>("lessons")
  const [isTabReady, setIsTabReady] = useState(false)

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    if (isDashboardTab(tabFromQuery)) {
      setActiveTab(tabFromQuery)
      setIsTabReady(true)
      return
    }

    const savedTab = localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY)
    if (isDashboardTab(savedTab)) {
      setActiveTab(savedTab)
      setIsTabReady(true)
      return
    }

    setIsTabReady(true)
  }, [searchParams])

  const handleTabChange = (nextTab: string) => {
    if (!isDashboardTab(nextTab)) return

    setActiveTab(nextTab)
    localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, nextTab)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        {!isTabReady ? (
          <div className="h-14 w-full rounded-lg border border-border bg-card" />
        ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-card border border-border rounded-lg p-1">
            <TabsTrigger value="lessons" className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="flex items-center gap-2 text-base">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Curriculum</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            <LessonsTab />
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <CurriculumTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <UserInfoTab />
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  )
}
