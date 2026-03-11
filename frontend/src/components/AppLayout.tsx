import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  Settings,
  Globe,
  FileText,
  Clock,
  LogIn,
  LogOut,
  Route as RouteIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/dns", label: "DNS 设置", icon: Globe },
  { path: "/inbounds", label: "入站设置", icon: LogIn },
  { path: "/outbounds", label: "出站设置", icon: LogOut },
  { path: "/route", label: "路由设置", icon: RouteIcon },
  { path: "/ntp", label: "NTP 设置", icon: Clock },
  { path: "/experimental", label: "实验功能", icon: Settings },
  { path: "/log", label: "日志设置", icon: FileText },
] as const;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (state.status !== "authenticated") return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="关闭侧栏"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar: drawer on mobile, static on md+ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-[transform,width] duration-200 ease-out md:static md:translate-x-0 md:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "w-64 md:w-64",
          sidebarCollapsed && "md:w-18",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2 md:px-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭菜单"
          >
            <X className="h-5 w-5" />
          </Button>
          <Link
            to="/"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 font-semibold tracking-tight md:min-w-0",
              sidebarCollapsed && "md:flex-none md:justify-center md:px-0",
            )}
          >
            <span
              className={cn(
                "hidden truncate sm:inline",
                sidebarCollapsed && "md:hidden",
              )}
            >
              Singbox Panel
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 md:flex"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  sidebarCollapsed && "md:justify-center md:gap-0 md:px-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "truncate min-w-0",
                  sidebarCollapsed &&
                    "md:w-0 md:min-w-0 md:overflow-hidden md:max-w-0 md:p-0 md:invisible",
                )}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
              sidebarCollapsed && "md:justify-center md:gap-0 md:px-2",
            )}
            onClick={handleLogout}
            title={sidebarCollapsed ? "退出登录" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "truncate min-w-0",
                sidebarCollapsed &&
                  "md:w-0 md:min-w-0 md:overflow-hidden md:max-w-0 md:p-0 md:invisible",
              )}
            >
              退出登录
            </span>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
