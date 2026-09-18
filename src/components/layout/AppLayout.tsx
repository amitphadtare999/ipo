import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/layout/AppSidebar"

const pageTitles: Record<string, { title: string; description: string }> = {
  "/":               { title: "IPOs",           description: "Manage and track your IPO investments" },
  "/demat-accounts": { title: "Demat Accounts", description: "Manage your demat accounts for IPO applications" },
  "/dashboard":      { title: "Dashboard",      description: "Your IPO investment overview" },
}

export default function AppLayout() {
  const location = useLocation()

  // IPO detail pages
  const isIpoDetail = location.pathname.startsWith("/ipo/")
  const isDematDetail = location.pathname.startsWith("/demat-accounts/")
  const meta = isIpoDetail
    ? { title: "IPO Detail", description: "IPO details & application tracker" }
    : isDematDetail
    ? { title: "Demat Account", description: "Applications made from this account" }
    : (pageTitles[location.pathname] ?? { title: "IPO Tracker", description: "" })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top header bar inside the main content area */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div>
              <h1 className="text-sm font-semibold leading-none">{meta.title}</h1>
              {meta.description && (
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {meta.description}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6 w-full min-w-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
