"use client"

import { Suspense, useEffect, useState } from "react"
import LessonsTab from "./lessons-tab"
import CurriculumTab from "./curriculum-tab"
import UserInfoTab from "./user-info-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ClipboardList, User } from "lucide-react"
import DashboardHeader from "./dashboard-header"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"

const DASHBOARD_TABS = ["lessons", "curriculum", "profile"] as const
type DashboardTab = (typeof DASHBOARD_TABS)[number]
const DASHBOARD_TAB_STORAGE_KEY = "user-dashboard-active-tab"

function isDashboardTab(value: string | null): value is DashboardTab {
  return value !== null && DASHBOARD_TABS.includes(value as DashboardTab)
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted" />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>("lessons")
  const [isTabReady, setIsTabReady] = useState(false)
  useEffect(() => {
    const syncSession = async () => {
      const sessionResult = supabase ? await supabase.auth.getSession() : null;
      const session = sessionResult?.data?.session;

      if (session) {
        await fetch("/api/proxy/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
        return;
      }

      // Email/password auth uses httpOnly cookies from backend proxy.
      // If refresh succeeds, keep user on dashboard instead of forcing auth redirect.
      const refreshRes = await fetch("/api/proxy/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!refreshRes.ok) {
        router.replace("/auth?auth=sign-in");
      }
    };

    syncSession();
  }, []);

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

  // if (!ready) return <div>Loading...</div>;

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
