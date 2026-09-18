"use client";

import { useState, type ReactNode } from "react";
import {
  ClipboardList,
  FileText,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MessageSquareQuote,
  Package,
  ScrollText,
  Stethoscope,
  Tags,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoHorizontal } from "@/components/brand/Logo";
import { useRouterStore } from "@/lib/store";
import type { AdminInfo } from "@/components/admin/LoginForm";
import { cn } from "@/lib/utils";

export const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "appointments", label: "Appointment Requests", icon: ClipboardList },
  { id: "messages", label: "Contact Messages", icon: MessageSquare },
  { id: "services", label: "Services", icon: Stethoscope },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "packages", label: "Packages", icon: Package },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "content", label: "Website Content", icon: FileText },
  { id: "logs", label: "Audit Logs", icon: ScrollText },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

function DemoStrip() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-gold/30 bg-gold/10 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-text sm:text-[11.5px]"
    >
      <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
      You are viewing sample/demo data — verify all content before publishing to production.
    </div>
  );
}

function NavList({
  active,
  onNavigate,
  onAfterNavigate,
}: {
  active: AdminTabId;
  onNavigate: (tab: AdminTabId) => void;
  onAfterNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto p-3">
      {ADMIN_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => {
              onNavigate(tab.id);
              onAfterNavigate?.();
            }}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors",
              isActive
                ? "border-gold bg-white/[0.06] text-gold"
                : "border-transparent text-white/60 hover:bg-white/5 hover:text-ink"
            )}
          >
            <tab.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-gold" : "text-steel")} aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function AdminLayout({
  admin,
  active,
  onNavigate,
  onLogout,
  children,
}: {
  admin: AdminInfo;
  active: AdminTabId;
  onNavigate: (tab: AdminTabId) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeLabel = ADMIN_TABS.find((t) => t.id === active)?.label ?? "Overview";
  const navigate = useRouterStore((s) => s.navigate);

  return (
    <div className="min-h-screen bg-soft/60">
      <DemoStrip />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brandborder bg-card lg:flex">
          <div className="border-b border-brandborder px-5 py-4">
            <LogoHorizontal showTagline={false} />
          </div>
          <NavList active={active} onNavigate={onNavigate} />
          <div className="border-t border-brandborder p-4">
            <p className="text-[11px] leading-relaxed text-inkmuted">
              Signed in as <span className="font-bold text-ink">{admin.name || admin.username}</span>. All
              administrative actions are recorded in the audit log.
            </p>
          </div>
        </aside>

        {/* Right column: top bar + content */}
        <div className="min-w-0 flex-1">
          <header className="glass-card sticky top-0 z-40 border-b border-brandborder">
            <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open admin menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="border-b border-brandborder p-4 text-left">
                    <SheetTitle asChild>
                      <div>
                        <LogoHorizontal className="origin-left scale-90" showTagline={false} />
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <NavList active={active} onNavigate={onNavigate} onAfterNavigate={() => setDrawerOpen(false)} />
                  <div className="border-t border-brandborder p-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        setDrawerOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <span className="text-sm font-extrabold text-ink lg:hidden">Admin</span>
              <span className="hidden text-sm font-bold text-inkmuted lg:inline">/ {activeLabel}</span>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden border border-brandborder bg-soft px-3 py-1 text-xs font-bold text-ink md:inline">
                  {admin.name || admin.username}
                  <span className="ml-1.5 font-medium text-inkmuted">({admin.role})</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate("#/")}>
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">View Site</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          <main id="admin-main" className="min-w-0 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
