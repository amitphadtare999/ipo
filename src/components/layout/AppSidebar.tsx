import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TrendingUp, CreditCard, BarChart3, LogOut } from "lucide-react"

const navItems = [
  { path: "/",               label: "IPOs",           icon: TrendingUp },
  { path: "/demat-accounts", label: "Demat Accounts", icon: CreditCard },
  { path: "/dashboard",      label: "Dashboard",      icon: BarChart3 },
]

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      {/* App name */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="IPO Tracker">
              <Link to="/">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  📈
                </div>
                <span className="font-semibold text-sm">IPO Tracker</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.path === "/" ? location.pathname === "/" || location.pathname.startsWith("/ipo/") : location.pathname.startsWith(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User / sign out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground overflow-hidden">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold">
                {user?.email?.slice(0, 1).toUpperCase() ?? "U"}
              </div>
              <span className="truncate flex-1">{user?.email}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
