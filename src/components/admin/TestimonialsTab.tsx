"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareQuote, Pencil, Plus, Trash2 } from "lucide-react";
import { api, type TestimonialDTO } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AdminField,
  DeleteConfirmDialog,
  EmptyState,
  ListSkeleton,
  mutationError,
  ResponsiveTableWrap,
  TabHeader,
} from "@/components/admin/admin-shared";
import { StarRating } from "@/components/site/StarRating";

const QUERY_KEY = "admin-testimonials";

interface TestimonialDraft {
  name: string;
  area: string;
  rating: string;
  text: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY_DRAFT: TestimonialDraft = {
  name: "",
  area: "",
  rating: "5",
  text: "",
  sortOrder: "0",
  published: true,
};

/** Gold stars out of 5 (read-only display) — shared implementation lives in site/StarRating. */

function TestimonialDialog({
  openState,
  onClose,
}: {
  openState: { mode: "create" } | { mode: "edit"; item: TestimonialDTO } | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = openState?.mode === "edit" ? openState.item : null;

  const [draft, setDraft] = useState<TestimonialDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "text", string>>>({});

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): rebuild the draft each time the dialog opens.
  const [lastOpenState, setLastOpenState] = useState(openState);
  if (openState !== lastOpenState) {
    setLastOpenState(openState);
    if (openState) {
      setDraft(
        editing
          ? {
              name: editing.name,
              area: editing.area ?? "",
              rating: String(editing.rating),
              text: editing.text,
              sortOrder: String(editing.sortOrder),
              published: editing.published,
            }
          : { ...EMPTY_DRAFT }
      );
      setFieldErrors({});
    }
  }

  function set<K extends keyof TestimonialDraft>(key: K, value: TestimonialDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in fieldErrors) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        area: draft.area.trim() || null,
        rating: Number(draft.rating) || 5,
        text: draft.text.trim(),
        sortOrder: Number(draft.sortOrder) || 0,
        published: draft.published,
      };
      return editing
        ? api.patch<TestimonialDTO>(`/api/testimonials/${editing.id}`, payload)
        : api.post<TestimonialDTO>("/api/testimonials", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast({ title: editing ? "Testimonial updated" : "Testimonial created" });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    const errs: typeof fieldErrors = {};
    if (draft.name.trim().length < 2) errs.name = "Enter the patient name (min 2 characters).";
    if (draft.text.trim().length < 10) errs.text = "Enter the feedback text (min 10 characters).";
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    save.mutate();
  }

  return (
    <Dialog open={!!openState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-ink">{editing ? "Edit testimonial" : "Add new testimonial"}</DialogTitle>
          <DialogDescription>
            Patient feedback shown in the “What Patients Say” section on the home page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="tst-name" label="Patient name" required error={fieldErrors.name}>
              <Input id="tst-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. R. Kulkarni" />
            </AdminField>
            <AdminField id="tst-area" label="Area / locality" hint="e.g. Thane West.">
              <Input id="tst-area" value={draft.area} onChange={(e) => set("area", e.target.value)} />
            </AdminField>
          </div>
          <AdminField id="tst-text" label="Feedback" required error={fieldErrors.text}>
            <textarea
              id="tst-text"
              rows={4}
              value={draft.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="What did the patient appreciate? Keep it specific and credible."
              className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="tst-rating" label="Rating" hint="1 to 5 stars.">
              <select
                id="tst-rating"
                value={draft.rating}
                onChange={(e) => set("rating", e.target.value)}
                className="flex h-10 w-full border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-medblue"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField id="tst-sort" label="Sort order">
              <Input id="tst-sort" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </AdminField>
          </div>
          <div className="flex items-start justify-between gap-4 border border-brandborder bg-soft/50 px-4 py-3">
            <div>
              <label htmlFor="tst-published" className="text-sm font-semibold text-ink">
                Published
              </label>
              <p className="mt-0.5 text-xs text-inkmuted">Visible in the home page section.</p>
            </div>
            <Switch id="tst-published" checked={draft.published} onCheckedChange={(v) => set("published", v)} />
          </div>
          <p className="text-xs leading-relaxed text-inkmuted">
            Note: only publish feedback actually received by the centre — the seeded entries are clearly labelled
            demo samples and should be replaced or unpublished before go-live.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Create testimonial"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TestimonialsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; item: TestimonialDTO } | null>(null);

  const list = useQuery<TestimonialDTO[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => api.get<TestimonialDTO[]>("/api/testimonials?all=1"),
  });

  const items = useMemo(() => list.data ?? [], [list.data]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
  }

  const toggle = useMutation({
    mutationFn: ({ item, published }: { item: TestimonialDTO; published: boolean }) =>
      api.patch<TestimonialDTO>(`/api/testimonials/${item.id}`, { published }),
    onSuccess: (updated) => {
      invalidate();
      toast({ title: `Testimonial ${updated.published ? "published" : "unpublished"}` });
    },
    onError: (err) => {
      invalidate();
      mutationError(err, toast, "Update failed");
    },
  });

  const remove = useMutation({
    mutationFn: (item: TestimonialDTO) => api.delete(`/api/testimonials/${item.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Testimonial deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="Testimonials"
        description="Patient feedback shown in the home page “What Patients Say” section."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add testimonial
          </Button>
        }
      />

      {list.isLoading ? (
        <ListSkeleton rows={5} />
      ) : list.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load testimonials. Please refresh.</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="h-10 w-10" aria-hidden />}
          title="No testimonials yet"
          hint="Add genuine patient feedback to build trust on the home page."
        />
      ) : (
        <ResponsiveTableWrap>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                <th scope="col" className="px-4 py-3 font-bold">Patient</th>
                <th scope="col" className="px-4 py-3 font-bold">Rating</th>
                <th scope="col" className="px-4 py-3 font-bold">Sort</th>
                <th scope="col" className="px-4 py-3 font-bold">Published</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/60">
                  <td className="max-w-md px-4 py-3">
                    <p className="truncate font-bold text-ink">{t.name}</p>
                    <p className="truncate text-xs text-inkmuted">{t.text}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={t.rating} />
                  </td>
                  <td className="px-4 py-3 text-inkmuted">{t.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={t.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ item: t, published: v })}
                      aria-label={`${t.published ? "Unpublish" : "Publish"} testimonial`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-medblue hover:text-ink" aria-label="Edit testimonial" onClick={() => setDialog({ mode: "edit", item: t })}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteConfirmDialog
                        title="Delete this testimonial?"
                        description="This permanently removes the feedback entry."
                        onConfirm={() => remove.mutate(t)}
                        disabled={remove.isPending}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" aria-label="Delete testimonial" disabled={remove.isPending}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </DeleteConfirmDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrap>
      )}

      <TestimonialDialog openState={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
