"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  FilterX,
  Mail,
  MessageSquare,
  Phone,
  Search,
  StickyNote,
} from "lucide-react";
import { api, type ContactMessageDTO } from "@/lib/api-client";
import { MESSAGE_STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DeleteConfirmDialog,
  EmptyState,
  ListSkeleton,
  ResponsiveTableWrap,
  StatusBadge,
  TabHeader,
  fmtDateTime,
  mutationError,
  useDebouncedValue,
} from "@/components/admin/admin-shared";

const QUERY_KEY = "admin-messages";

function MessageDetailDialog({
  messageId,
  messages,
  onClose,
}: {
  messageId: string | null;
  messages: ContactMessageDTO[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const message = useMemo(() => messages.find((m) => m.id === messageId) ?? null, [messages, messageId]);

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("NEW");

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): re-sync the editable fields whenever the dialog target or its
  // server data changes.
  const syncKey = {
    messageId,
    internalNotes: message?.internalNotes,
    status: message?.status,
  };
  const [lastSyncKey, setLastSyncKey] = useState(syncKey);
  if (
    syncKey.messageId !== lastSyncKey.messageId ||
    syncKey.internalNotes !== lastSyncKey.internalNotes ||
    syncKey.status !== lastSyncKey.status
  ) {
    setLastSyncKey(syncKey);
    setNotes(message?.internalNotes ?? "");
    setStatus(message?.status ?? "NEW");
  }

  const patch = useMutation({
    mutationFn: (data: { status?: string; internalNotes?: string }) =>
      api.patch<ContactMessageDTO>(`/api/contact/${messageId}`, data),
    onSuccess: (updated, vars) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: vars.internalNotes !== undefined ? "Internal notes saved" : `Status updated to ${updated.status}`,
      });
    },
    onError: (err) => mutationError(err, toast, "Update failed"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/contact/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Message deleted" });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <Dialog open={!!messageId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
        {message ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-ink">
                Contact message
                <StatusBadge status={status} />
              </DialogTitle>
              <DialogDescription>Received {fmtDateTime(message.createdAt)}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-inkmuted">From</p>
                <p className="text-sm font-bold text-ink">{message.name}</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-inkmuted">
                    <Phone className="h-3.5 w-3.5" aria-hidden /> Phone
                  </p>
                  <a href={`tel:+91${message.phone}`} className="text-sm font-bold text-medblue hover:underline">
                    +91 {message.phone}
                  </a>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-inkmuted">
                    <Mail className="h-3.5 w-3.5" aria-hidden /> Email
                  </p>
                  {message.email ? (
                    <a href={`mailto:${message.email}`} className="text-sm font-semibold text-medblue hover:underline">
                      {message.email}
                    </a>
                  ) : (
                    <span className="text-sm text-inkmuted">Not provided</span>
                  )}
                </div>
                {message.subject && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-inkmuted">Subject</p>
                    <Badge variant="outline" className="border-brandborder font-semibold text-ink">
                      {message.subject}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator className="bg-brandborder" />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-inkmuted">Message</p>
                <p className="mt-1 whitespace-pre-line rounded-xl bg-soft/70 p-3 text-sm leading-relaxed text-ink">
                  {message.message}
                </p>
              </div>

              <Separator className="bg-brandborder" />

              <div>
                <Label htmlFor="message-status">Update status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    patch.mutate({ status: v });
                  }}
                >
                  <SelectTrigger id="message-status" className="mt-1.5 w-full rounded-xl sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message-notes" className="flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-medblue" aria-hidden />
                  Internal notes (staff only)
                </Label>
                <Textarea
                  id="message-notes"
                  rows={3}
                  placeholder="e.g. Replied by email on 12 Jan — needs callback."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 rounded-xl"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={patch.isPending || notes === (message.internalNotes ?? "")}
                    onClick={() => patch.mutate({ internalNotes: notes })}
                  >
                    Save notes
                  </Button>
                  <DeleteConfirmDialog
                    title="Delete this message?"
                    description="This permanently removes the message from the system."
                    onConfirm={() => remove.mutate()}
                    disabled={remove.isPending}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
                      disabled={remove.isPending}
                    >
                      {remove.isPending ? "Deleting…" : "Delete message"}
                    </Button>
                  </DeleteConfirmDialog>
                </div>
              </div>
            </div>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>Message not found</DialogTitle>
            <DialogDescription>This message may have been deleted.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MessagesTab() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const list = useQuery<ContactMessageDTO[]>({
    queryKey: [QUERY_KEY, statusFilter],
    queryFn: () =>
      api.get<ContactMessageDTO[]>(`/api/contact${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`),
    placeholderData: (prev) => prev,
  });

  const messages = useMemo(() => {
    const data = list.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    // Search is applied client-side (API exposes only the status filter).
    if (!q) return data;
    return data.filter((m) =>
      [m.name, m.phone, m.email ?? "", m.subject ?? "", m.message]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [list.data, debouncedSearch]);

  // Keep a rolling map of every loaded message so the detail dialog keeps
  // working even if a status change moves the row out of the active filter.
  // Held in state and merged during render (adjust-state-during-render
  // pattern) instead of mutating a ref, which React forbids while rendering.
  const [seen, setSeen] = useState<{ source: ContactMessageDTO[]; map: Map<string, ContactMessageDTO> }>({
    source: messages,
    map: new Map(),
  });
  if (messages !== seen.source) {
    const map = new Map(seen.map);
    for (const m of messages) map.set(m.id, m);
    setSeen({ source: messages, map });
  }
  const dialogMessages = useMemo(() => {
    if (selectedId && !messages.some((m) => m.id === selectedId)) {
      const seenItem = seen.map.get(selectedId);
      if (seenItem) return [...messages, seenItem];
    }
    return messages;
  }, [messages, selectedId, seen]);

  const hasFilters = statusFilter !== "ALL" || search !== "";

  return (
    <div>
      <TabHeader
        title="Contact Messages"
        description="Enquiries from the public contact form. Open a message to respond, update its status and record follow-up notes."
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => window.open("/api/admin/export?type=messages", "_blank")}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-2xl border border-brandborder bg-card p-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
          <Input
            type="search"
            placeholder="Search name, phone, subject or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-9"
            aria-label="Search messages"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-xl" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {MESSAGE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-xl"
              aria-label="Clear filters"
              title="Clear filters"
              onClick={() => {
                setStatusFilter("ALL");
                setSearch("");
              }}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {list.isLoading ? (
        <ListSkeleton rows={6} />
      ) : list.isError ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">
            Could not load messages. Please refresh.
          </CardContent>
        </Card>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10" aria-hidden />}
          title={hasFilters ? "No messages match these filters" : "No contact messages yet"}
          hint={
            hasFilters
              ? "Try clearing the search or switching the status filter."
              : "Enquiries submitted from the “Contact Us” page will appear here."
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-inkmuted">
            Showing {messages.length} message{messages.length === 1 ? "" : "s"} — click a row for full details
          </p>

          <ResponsiveTableWrap>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                  <th scope="col" className="px-4 py-3 font-bold">Received</th>
                  <th scope="col" className="px-4 py-3 font-bold">From</th>
                  <th scope="col" className="px-4 py-3 font-bold">Subject</th>
                  <th scope="col" className="px-4 py-3 font-bold">Message</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`cursor-pointer border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/70 ${
                      m.status === "NEW" ? "bg-teal-soft/20" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-inkmuted">{fmtDateTime(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{m.name}</p>
                      <p className="text-xs text-inkmuted">+91 {m.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">{m.subject ?? <span className="text-inkmuted">—</span>}</td>
                    <td className="max-w-56 px-4 py-3">
                      <p className="truncate text-inkmuted">{m.message}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <ChevronDown className="ml-auto h-4 w-4 rotate-[-90deg] text-inkmuted" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-brandborder md:hidden">
              {messages.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full px-4 py-3 text-left transition-colors active:bg-soft ${
                      m.status === "NEW" ? "bg-teal-soft/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">{m.name}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink">
                      {m.subject ? `${m.subject}: ` : ""}
                      {m.message}
                    </p>
                    <p className="mt-0.5 text-xs text-inkmuted">
                      +91 {m.phone} · {fmtDateTime(m.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </ResponsiveTableWrap>
        </>
      )}

      <MessageDetailDialog messageId={selectedId} messages={dialogMessages} onClose={() => setSelectedId(null)} />
    </div>
  );
}
