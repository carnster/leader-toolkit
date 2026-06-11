import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Search,
  FileText,
  PlayCircle,
  BarChart3,
  Shield,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Users,
  Settings as SettingsIcon
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { InitiativeSwitcher } from "@/components/InitiativeSwitcher";
import impactLogo from "@/assets/impact-logo.png";
import { stageColorFor } from "@/lib/stageColors";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { useStageCompletion, type StageStatus } from "@/hooks/useStageCompletion";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Decide", href: "/decide", icon: Search },
  { name: "Plan & Prepare", href: "/plan", icon: FileText },
  { name: "Implement", href: "/implement", icon: PlayCircle },
  { name: "Spread & Sustain", href: "/sustain", icon: Shield },
];

const hubs = [
  { name: "Team", href: "/team", icon: Users },
  { name: "Monitoring", href: "/monitor", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { initiativeId } = useInitiativeContext();
  const completion = useStageCompletion(initiativeId || undefined);

  const STAGE_KEYS: Record<string, "decide" | "plan" | "implement" | "sustain"> = {
    "/decide": "decide",
    "/plan": "plan",
    "/implement": "implement",
    "/sustain": "sustain",
  };
  const statusFor = (href: string): StageStatus | null => {
    const key = STAGE_KEYS[href];
    return key && completion ? completion[key] : null;
  };
  const remainingFor = (href: string): string | undefined => {
    const key = STAGE_KEYS[href];
    return key && completion ? completion.remaining[key] : undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src={impactLogo}
                alt="IMPACT"
                className="h-10 w-auto object-contain"
              />
              <span className="hidden font-bold text-lg sm:inline-block">
                Companion
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const stageColor = stageColorFor(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={remainingFor(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isActive && !stageColor && "bg-primary"
                    )}
                    style={isActive && stageColor ? { backgroundColor: stageColor } : undefined}
                  >
                    {stageColor && (() => {
                      const status = statusFor(item.href);
                      const dotColor = isActive ? "rgba(255,255,255,0.95)" : stageColor;
                      if (status === "complete") {
                        return (
                          <span
                            aria-label="Stage complete"
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full shrink-0 text-[9px] font-bold"
                            style={{ backgroundColor: dotColor, color: isActive ? stageColor : "#fff" }}
                          >
                            ✓
                          </span>
                        );
                      }
                      if (status === "in_progress") {
                        return (
                          <span
                            aria-label="Stage in progress"
                            className="h-2.5 w-2.5 rounded-full border-2 shrink-0"
                            style={{ borderColor: dotColor, backgroundColor: "transparent" }}
                          />
                        );
                      }
                      return (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor, opacity: status === "not_started" ? 0.35 : 1 }}
                        />
                      );
                    })()}
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {/* Cross-cutting hubs: continuous companions, not stages */}
              <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
              {hubs.map((hub) => (
                <Link
                  key={hub.name}
                  to={hub.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed transition-colors",
                    location.pathname === hub.href
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <hub.icon className="h-4 w-4" />
                  <span>{hub.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Menu & Notifications */}
          <div className="hidden md:flex items-center gap-2">
            <InitiativeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="hidden h-5 w-5 dark:block" />
            </Button>
            <NotificationsPanel />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-xs text-muted-foreground">Signed in as</span>
                  <span className="block truncate max-w-[220px]">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile theme toggle & menu button */}
          <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          </div>
        </div>

        {/* Stage identity bar: which stage of the journey this page is */}
        {stageColorFor(location.pathname) && (
          <div
            aria-hidden="true"
            className="h-1 w-full"
            style={{ backgroundColor: stageColorFor(location.pathname)! }}
          />
        )}

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const stageColor = stageColorFor(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isActive && !stageColor && "bg-primary"
                    )}
                    style={isActive && stageColor ? { backgroundColor: stageColor } : undefined}
                  >
                    {stageColor && (() => {
                      const status = statusFor(item.href);
                      const dotColor = isActive ? "rgba(255,255,255,0.95)" : stageColor;
                      if (status === "complete") {
                        return (
                          <span
                            aria-label="Stage complete"
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full shrink-0 text-[9px] font-bold"
                            style={{ backgroundColor: dotColor, color: isActive ? stageColor : "#fff" }}
                          >
                            ✓
                          </span>
                        );
                      }
                      if (status === "in_progress") {
                        return (
                          <span
                            aria-label="Stage in progress"
                            className="h-2.5 w-2.5 rounded-full border-2 shrink-0"
                            style={{ borderColor: dotColor, backgroundColor: "transparent" }}
                          />
                        );
                      }
                      return (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor, opacity: status === "not_started" ? 0.35 : 1 }}
                        />
                      );
                    })()}
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {/* Cross-cutting hubs: continuous companions, not stages */}
              <div className="my-2 border-t" aria-hidden="true" />
              {hubs.map((hub) => (
                <Link
                  key={hub.name}
                  to={hub.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md border border-dashed transition-colors",
                    location.pathname === hub.href
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <hub.icon className="h-4 w-4" />
                  <span>{hub.name}</span>
                </Link>
              ))}
              {/* Account actions (no avatar menu on mobile) */}
              <div className="my-2 border-t" aria-hidden="true" />
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
