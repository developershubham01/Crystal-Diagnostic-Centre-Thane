"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  Download,
  ExternalLink,
  HelpCircle,
  Images,
  Inbox,
  MessageSquare,
  Package,
  Plus,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api, type AppointmentDTO } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListSkeleton, StatusBadge, TabHeader, fmtDate, fmtDateTime } from "@/components/admin/admin-shared";
import type { AdminTabId } from "@/components/admin/AdminLayout";
import { useRouterStore } from "@/lib/store";

interface StatsDTO {
  totalAppointments: number;
  newAppointments: number;
  weekAppointments: number;
  totalMessages: number;
  newMessages: number;
  servicesCount: number;
  packagesCount: number;
  faqsCount: number;
  galleryCount: number;
  statusCounts: Record<string, number>;
  trend: { date: string; count: number }[];
}

function StatCard({
  icon,
  label,
  value,
  badge,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  badge?: string;
  hint?: string;
}) {
  return (
    <Card className="card-lift border-white/10 bg-card p-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="hex flex h-10 w-10 items-center justify-center bg-gold/10 text-gold">{icon}</span>
          {badge && (
            <span className="border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-text" style={{ borderRadius: 2 }}>
              {badge}
            </span>
          )}
        </div>
        <p className="mt-3 font-display text-3xl tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ash">{label}</p>
        {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  const max = Math.max(1, ...trend.map((t) => t.count));

  // Week-over-week delta (last 7 vs previous 7 of the 14-day window)
  const last7 = trend.slice(-7).reduce((a, t) => a + t.count, 0);
  const prev7 = trend.slice(0, 7).reduce((a, t) => a + t.count, 0);
  const hasDelta = last7 > 0 || prev7 > 0;
  const deltaPct = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
  const DeltaIcon = deltaPct > 0 ? TrendingUp : TrendingDown;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Requests per day</p>
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
              deltaPct > 0
                ? "border-gold/40 bg-gold/10 text-gold-text"
                : deltaPct < 0
                  ? "border-white/20 bg-white/5 text-ash"
                  : "border-white/15 bg-white/5 text-ash"
            }`}
            aria-label={`Requests ${deltaPct >= 0 ? "up" : "down"} ${Math.abs(deltaPct)} percent versus the previous week`}
          >
            <DeltaIcon className="h-3 w-3" aria-hidden />
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct}% vs previous week
          </span>
        )}
      </div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Appointment requests over the last 14 days">
        {trend.map((t, i) => {
          const pct = Math.round((t.count / max) * 100);
          const isToday = i === trend.length - 1;
          return (
            <div key={t.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full transition-all group-hover:opacity-80 ${isToday ? "bg-gold" : "bg-white/15"}`}
                style={{ height: `${Math.max(pct, t.count > 0 ? 8 : 3)}%` }}
                title={`${fmtDate(t.date)} — ${t.count} request${t.count === 1 ? "" : "s"}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-ash">
        <span>{fmtDate(trend[0]?.date)}</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-white/15" aria-hidden /> previous 7 days
          <span className="ml-2 inline-block h-2 w-2 bg-gold" aria-hidden /> last 7 days
        </span>
        <span>{fmtDate(trend[trend.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

export function OverviewTab({ onNavigate }: { onNavigate: (tab: AdminTabId) => void }) {
  const navigate = useRouterStore((s) => s.navigate);

  const stats = useQuery<StatsDTO>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<StatsDTO>("/api/admin/stats"),
    refetchInterval: 60_000,
  });

  const recent = useQuery<AppointmentDTO[]>({
    queryKey: ["overview-recent-appointments"],
    queryFn: () => api.get<AppointmentDTO[]>("/api/appointments"),
  });

  const s = stats.data;
  const recentAppointments = recent.data?.slice(0, 5) ?? [];

  return (
    <div>
      <TabHeader
        title="Dashboard Overview"
        description="A live snapshot of appointment requests, messages and website content. All figures are demo data until real requests arrive."
      />

      {stats.isLoading ? (
        <ListSkeleton rows={6} />
      ) : stats.isError || !s ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">
            Could not load dashboard statistics. Please refresh the page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<ClipboardList className="h-5 w-5" aria-hidden />}
              label="Total appointment requests"
              value={s.totalAppointments}
              badge={s.newAppointments > 0 ? `${s.newAppointments} new` : undefined}
            />
            <StatCard
              icon={<CalendarClock className="h-5 w-5" aria-hidden />}
              label="Requests this week"
              value={s.weekAppointments}
              hint="Last 7 days"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" aria-hidden />}
              label="Contact messages"
              value={s.totalMessages}
              badge={s.newMessages > 0 ? `${s.newMessages} new` : undefined}
            />
            <StatCard
              icon={<Inbox className="h-5 w-5" aria-hidden />}
              label="Requests awaiting action"
              value={s.statusCounts["NEW"] ?? 0}
              hint="Status NEW — needs a first call"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Stethoscope className="h-5 w-5" aria-hidden />} label="Services" value={s.servicesCount} />
            <StatCard icon={<Package className="h-5 w-5" aria-hidden />} label="Health packages" value={s.packagesCount} />
            <StatCard icon={<HelpCircle className="h-5 w-5" aria-hidden />} label="FAQs" value={s.faqsCount} />
            <StatCard icon={<Images className="h-5 w-5" aria-hidden />} label="Gallery images" value={s.galleryCount} />
          </div>

          {/* Trend + status breakdown */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-white/10 bg-card p-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-display text-base uppercase tracking-wide text-ink">
                  <TrendingUp className="h-4 w-4 text-gold" aria-hidden />
                  Appointment requests — last 14 days
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <TrendChart trend={s.trend} />
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card p-0">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base uppercase tracking-wide text-ink">Requests by status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 p-5 pt-0">
                {["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"].map((status) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-extrabold text-ink">{s.statusCounts[status] ?? 0}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent requests */}
          <Card className="border-white/10 bg-card p-0">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base uppercase tracking-wide text-ink">Latest appointment requests</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {recent.isLoading ? (
                <ListSkeleton rows={3} />
              ) : recentAppointments.length === 0 ? (
                <p className="py-6 text-center text-sm text-inkmuted">
                  No appointment requests yet — new requests will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-white/10">
                  {recentAppointments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {a.name} <span className="font-normal text-inkmuted">· {a.testOrPackage}</span>
                        </p>
                        <p className="text-xs text-inkmuted">
                          {fmtDateTime(a.createdAt)}
                          {a.preferredDate ? ` · prefers ${fmtDate(a.preferredDate)}` : ""}
                          {a.preferredTime ? ` · ${a.preferredTime}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div>
            <p className="eyebrow mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Quick actions
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button onClick={() => onNavigate("appointments")}>
                <ClipboardList className="h-4 w-4" aria-hidden />
                Review Requests
              </Button>
              <Button variant="outline" onClick={() => onNavigate("messages")}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                Open Messages
              </Button>
              <Button variant="outline" onClick={() => onNavigate("services")}>
                <Plus className="h-4 w-4" aria-hidden />
                Manage Services
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("/api/admin/export?type=appointments", "_blank")}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export Requests (CSV)
              </Button>
              <Button variant="outline" onClick={() => navigate("#/")}>
                <ExternalLink className="h-4 w-4" aria-hidden />
                View Site
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
