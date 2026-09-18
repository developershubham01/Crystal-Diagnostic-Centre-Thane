"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  History,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { AdminLayout, type AdminTabId } from "@/components/admin/AdminLayout";
import { LoginForm, type AdminInfo } from "@/components/admin/LoginForm";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { AppointmentsTab } from "@/components/admin/AppointmentsTab";
import { MessagesTab } from "@/components/admin/MessagesTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { PackagesTab } from "@/components/admin/PackagesTab";
import { FaqsTab } from "@/components/admin/FaqsTab";
import { TestimonialsTab } from "@/components/admin/TestimonialsTab";
import { GalleryTab } from "@/components/admin/GalleryTab";
import {
  EmptyState,
  ListSkeleton,
  ResponsiveTableWrap,
  TabHeader,
  onSessionExpired,
  fmtDateTime,
  mutationError,
} from "@/components/admin/admin-shared";

/**
 * AdminPage — standalone dashboard at #/admin.
 * Auth gate (session cookie) → LoginForm | AdminLayout with tab content.
 * Includes Website Content (settings) editor and Audit Logs viewer.
 */

/* ---------------- Website Content tab (settings editor) ---------------- */

const MULTILINE_KEYS = new Set([
  "address",
  "workingHours",
  "heroSubheadline",
  "aboutIntro",
  "aboutMission",
  "aboutVision",
  "aboutPhilosophy",
  "aboutFacilities",
  "aboutQuality",
  "whyChooseUs",
  "seoDescription",
  "seoKeywords",
  "footerAbout",
  "reportsNotice",
  "bookTestNote",
  "demoNotice",
]);

const SETTING_GROUPS: { title: string; keys: (keyof SiteSettings)[] }[] = [
  {
    title: "Business & Contact",
    keys: ["businessName", "tagline", "phone", "email", "emailNote", "whatsappNumber", "workingHours", "workingHoursNote", "address"],
  },
  {
    title: "Homepage",
    keys: ["heroHeadline", "heroSubheadline", "homeServicesIntro", "homePackagesIntro", "homeTechHeading", "homeTechBody"],
  },
  {
    title: "About Page",
    keys: ["aboutIntro", "aboutMission", "aboutVision", "aboutPhilosophy", "aboutFacilities", "aboutQuality"],
  },
  {
    title: "SEO",
    keys: ["seoTitle", "seoDescription", "seoKeywords"],
  },
  {
    title: "Notices & Footer",
    keys: ["footerAbout", "demoNotice", "reportsNotice", "bookTestNote", "homeCollectionAvailable"],
  },
  {
    title: "Social Links",
    keys: ["socialFacebook", "socialInstagram", "socialTwitter", "socialLinkedin"],
  },
];

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function WebsiteContentTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<SiteSettings>("/api/settings"),
  });

  const [draft, setDraft] = useState<SiteSettings | null>(null);

  // Sync local draft whenever fresh settings arrive (adjust-during-render pattern)
  const fetched = settingsQuery.data;
  const [lastFetched, setLastFetched] = useState<SiteSettings | null>(null);
  if (fetched && fetched !== lastFetched) {
    setLastFetched(fetched);
    setDraft(fetched);
  }

  const save = useMutation({
    mutationFn: (next: SiteSettings) => api.put<SiteSettings>("/api/settings", next),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setDraft(saved);
      toast({ title: "Content saved", description: "Website copy and contact details updated." });
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  if (settingsQuery.isLoading || !draft) {
    return (
      <div className="space-y-3">
        <ListSkeleton rows={8} />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <EmptyState icon={<ShieldAlert className="h-6 w-6" aria-hidden />} title="Could not load settings" hint="Check your session and try again." />
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(fetched);

  return (
    <div>
      <TabHeader
        title="Website Content"
        description="All public copy, contact details and notices. Changes go live immediately after saving."
        actions={
          <Button onClick={() => save.mutate(draft)} disabled={!dirty || save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Save Changes
          </Button>
        }
      />
      <div className="space-y-8">
        {SETTING_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`cfg-${group.title.replace(/\W+/g, "-")}`}>
            <h2
              id={`cfg-${group.title.replace(/\W+/g, "-")}`}
              className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold"
            >
              {group.title}
            </h2>
            <Separator className="mt-2 mb-4 bg-white/10" />
            <div className="grid gap-4 md:grid-cols-2">
              {group.keys.map((key) => {
                const value = draft[key] ?? "";
                const multiline = MULTILINE_KEYS.has(key);
                return (
                  <div key={key} className={multiline ? "md:col-span-2" : undefined}>
                    <Label htmlFor={`cfg-${key}`} className="text-[10px] uppercase tracking-[0.18em] text-steel">
                      {humanizeKey(key)}
                    </Label>
                    {key === "homeCollectionAvailable" ? (
                      <Select
                        value={value || "tbc"}
                        onValueChange={(v) => setDraft({ ...draft, [key]: v })}
                      >
                        <SelectTrigger id={`cfg-${key}`} className="mt-1.5 border-white/15 bg-iron text-ink">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-popover">
                          <SelectItem value="yes">Yes — advertised</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="tbc">To be confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : multiline ? (
                      <Textarea
                        id={`cfg-${key}`}
                        rows={key === "whyChooseUs" ? 6 : 3}
                        value={value}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                        className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted"
                      />
                    ) : (
                      <Input
                        id={`cfg-${key}`}
                        value={value}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                        className="mt-1.5 border-white/15 bg-iron text-ink placeholder:text-inkmuted"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Audit Logs tab --------------------------- */

interface AuditLogDTO {
  id: string;
  adminId: string | null;
  adminName: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

function actionClass(action: string) {
  if (action === "CREATE") return "border-gold/40 text-gold";
  if (action === "DELETE") return "border-destructive/40 text-destructive";
  return "border-cyan-pulse/40 text-cyan-pulse";
}

function AuditLogsTab() {
  const logsQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => api.get<AuditLogDTO[]>("/api/audit-logs"),
  });

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  return (
    <div>
      <TabHeader
        title="Audit Logs"
        description="Administrative actions trail (latest 200). Every write operation is recorded automatically."
        actions={
          <Button variant="outline" onClick={() => logsQuery.refetch()} disabled={logsQuery.isFetching}>
            <RefreshCw className={logsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
            Refresh
          </Button>
        }
      />
      {logsQuery.isLoading && <ListSkeleton rows={8} />}
      {logsQuery.isError && (
        <EmptyState icon={<ShieldAlert className="h-6 w-6" aria-hidden />} title="Could not load audit logs" hint="Check your session and retry." />
      )}
      {!logsQuery.isLoading && !logsQuery.isError && logs.length === 0 && (
        <EmptyState icon={<History className="h-6 w-6" aria-hidden />} title="No activity yet" hint="Admin actions will appear here." />
      )}
      {logs.length > 0 && (
        <ResponsiveTableWrap>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-steel">
                <th className="px-3 py-2.5 font-semibold">When</th>
                <th className="px-3 py-2.5 font-semibold">Admin</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Entity</th>
                <th className="px-3 py-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="align-top transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-inkmuted">{fmtDateTime(log.createdAt)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-ink">{log.adminName ?? "system"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${actionClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-inkmuted">
                    {log.entity ?? "—"}
                    {log.entityId && <span className="block text-[10px] text-graphite">{log.entityId}</span>}
                  </td>
                  <td className="max-w-[24rem] px-3 py-2.5 text-xs text-inkmuted">{log.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrap>
      )}
    </div>
  );
}

/* ------------------------------ Admin page ------------------------------ */

function renderTab(tab: AdminTabId, onNavigate: (t: AdminTabId) => void) {
  switch (tab) {
    case "overview":
      return <OverviewTab onNavigate={onNavigate} />;
    case "appointments":
      return <AppointmentsTab />;
    case "messages":
      return <MessagesTab />;
    case "services":
      return <ServicesTab />;
    case "categories":
      return <CategoriesTab />;
    case "packages":
      return <PackagesTab />;
    case "faqs":
      return <FaqsTab />;
    case "testimonials":
      return <TestimonialsTab />;
    case "gallery":
      return <GalleryTab />;
    case "content":
      return <WebsiteContentTab />;
    case "logs":
      return <AuditLogsTab />;
    default:
      return <OverviewTab onNavigate={onNavigate} />;
  }
}

export function AdminPage() {
  const [phase, setPhase] = useState<"loading" | "anon" | "authed">("loading");
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [tab, setTab] = useState<AdminTabId>("overview");
  const { toast } = useToast();

  // Lightweight poll for unread appointment requests — powers the gold alert
  // badge on the sidebar. Shares the "admin-appointments" key prefix, so any
  // status change made in the tab refreshes the badge instantly.
  const newApptQuery = useQuery({
    queryKey: ["admin-appointments", "new-badge"],
    queryFn: () => api.get<{ id: string }[]>("/api/appointments?status=NEW"),
    enabled: phase === "authed",
    refetchInterval: 30_000,
  });
  const newRequests = phase === "authed" ? (newApptQuery.data?.length ?? 0) : 0;

  useEffect(() => {
    let live = true;
    api
      .get<{ adminId: string; username: string; role: string }>("/api/auth/me")
      .then((me) => {
        if (!live) return;
        setAdmin({ id: me.adminId, username: me.username, name: null, role: me.role });
        setPhase("authed");
      })
      .catch(() => {
        if (live) setPhase("anon");
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => onSessionExpired(() => {
    setAdmin(null);
    setPhase("anon");
    toast({ title: "Session expired", description: "Please sign in again." });
  }), [toast]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      // session is being cleared locally regardless
    }
    setAdmin(null);
    setPhase("anon");
  }, []);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading admin">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-inkmuted">Checking session</p>
          <Skeleton className="h-1 w-40 bg-white/10" />
        </div>
      </div>
    );
  }

  if (phase === "anon" || !admin) {
    return <LoginForm onSuccess={(a) => { setAdmin(a); setPhase("authed"); }} />;
  }

  return (
    <AdminLayout admin={admin} active={tab} onNavigate={setTab} onLogout={handleLogout} newRequests={newRequests}>
      {renderTab(tab, setTab)}
    </AdminLayout>
  );
}
