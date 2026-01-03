import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SessionExpiredHandler } from "@/components/session-expired-handler"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      {/* Main content con margen responsive */}
      <div className="flex flex-1 flex-col ml-0 md:ml-80">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
      <SessionExpiredHandler />
    </div>
  )
}

