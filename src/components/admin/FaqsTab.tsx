"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { api, type FaqDTO } from "@/lib/api-client";
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

const QUERY_KEY = "admin-faqs";

interface FaqDraft {
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY_DRAFT: FaqDraft = {
  question: "",
  answer: "",
  category: "",
  sortOrder: "0",
  published: true,
};

function FaqDialog({
  openState,
  onClose,
}: {
  openState: { mode: "create" } | { mode: "edit"; faq: FaqDTO } | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = openState?.mode === "edit" ? openState.faq : null;

  const [draft, setDraft] = useState<FaqDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"question" | "answer", string>>>({});

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): rebuild the draft each time the dialog opens.
  const [lastOpenState, setLastOpenState] = useState(openState);
  if (openState !== lastOpenState) {
    setLastOpenState(openState);
    if (openState) {
      setDraft(
        editing
          ? {
              question: editing.question,
              answer: editing.answer,
              category: editing.category ?? "",
              sortOrder: String(editing.sortOrder),
              published: editing.published,
            }
          : { ...EMPTY_DRAFT }
      );
      setFieldErrors({});
    }
  }

  function set<K extends keyof FaqDraft>(key: K, value: FaqDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in fieldErrors) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        category: draft.category.trim() || null,
        sortOrder: Number(draft.sortOrder) || 0,
        published: draft.published,
      };
      return editing ? api.patch<FaqDTO>(`/api/faqs/${editing.id}`, payload) : api.post<FaqDTO>("/api/faqs", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: editing ? "FAQ updated" : "FAQ created" });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    const errs: typeof fieldErrors = {};
    if (draft.question.trim().length < 5) errs.question = "Enter the question (min 5 characters).";
    if (draft.answer.trim().length < 2) errs.answer = "Enter the answer.";
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    save.mutate();
  }

  return (
    <Dialog open={!!openState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-ink">{editing ? "Edit FAQ" : "Add new FAQ"}</DialogTitle>
          <DialogDescription>Questions shown in the public FAQ section.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AdminField id="faq-question" label="Question" required error={fieldErrors.question}>
            <Input id="faq-question" value={draft.question} onChange={(e) => set("question", e.target.value)} placeholder="e.g. Do I need to fast before a blood test?" />
          </AdminField>
          <AdminField id="faq-answer" label="Answer" required error={fieldErrors.answer}>
            <textarea
              id="faq-answer"
              rows={4}
              value={draft.answer}
              onChange={(e) => set("answer", e.target.value)}
              className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="faq-category" label="Category" hint="Grouping label, e.g. Preparation.">
              <Input id="faq-category" value={draft.category} onChange={(e) => set("category", e.target.value)} />
            </AdminField>
            <AdminField id="faq-sort" label="Sort order">
              <Input id="faq-sort" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </AdminField>
          </div>
          <div className="flex items-start justify-between gap-4 border border-brandborder bg-soft/50 px-4 py-3">
            <div>
              <label htmlFor="faq-published" className="text-sm font-semibold text-ink">
                Published
              </label>
              <p className="mt-0.5 text-xs text-inkmuted">Visible on the public site.</p>
            </div>
            <Switch id="faq-published" checked={draft.published} onCheckedChange={(v) => set("published", v)} />
          </div>
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
              "Create FAQ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FaqsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; faq: FaqDTO } | null>(null);

  const list = useQuery<FaqDTO[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => api.get<FaqDTO[]>("/api/faqs?all=1"),
  });

  const faqs = useMemo(() => list.data ?? [], [list.data]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const toggle = useMutation({
    mutationFn: ({ faq, published }: { faq: FaqDTO; published: boolean }) =>
      api.patch<FaqDTO>(`/api/faqs/${faq.id}`, { published }),
    onSuccess: (updated) => {
      invalidate();
      toast({ title: `FAQ ${updated.published ? "published" : "unpublished"}` });
    },
    onError: (err) => {
      invalidate();
      mutationError(err, toast, "Update failed");
    },
  });

  const remove = useMutation({
    mutationFn: (faq: FaqDTO) => api.delete(`/api/faqs/${faq.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "FAQ deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="FAQs"
        description="Frequently asked questions shown on the public FAQ page."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add FAQ
          </Button>
        }
      />

      {list.isLoading ? (
        <ListSkeleton rows={5} />
      ) : list.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load FAQs. Please refresh.</CardContent>
        </Card>
      ) : faqs.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="h-10 w-10" aria-hidden />}
          title="No FAQs yet"
          hint="Add common patient questions about tests, preparation and reports."
        />
      ) : (
        <ResponsiveTableWrap>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                <th scope="col" className="px-4 py-3 font-bold">Question</th>
                <th scope="col" className="px-4 py-3 font-bold">Category</th>
                <th scope="col" className="px-4 py-3 font-bold">Sort</th>
                <th scope="col" className="px-4 py-3 font-bold">Published</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id} className="border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/60">
                  <td className="max-w-md px-4 py-3">
                    <p className="truncate font-bold text-ink">{f.question}</p>
                    <p className="truncate text-xs text-inkmuted">{f.answer}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{f.category ?? <span className="text-inkmuted">—</span>}</td>
                  <td className="px-4 py-3 text-inkmuted">{f.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={f.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ faq: f, published: v })}
                      aria-label={`${f.published ? "Unpublish" : "Publish"} FAQ`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-medblue hover:text-ink" aria-label="Edit FAQ" onClick={() => setDialog({ mode: "edit", faq: f })}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteConfirmDialog
                        title="Delete this FAQ?"
                        description="This permanently removes the question and answer."
                        onConfirm={() => remove.mutate(f)}
                        disabled={remove.isPending}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" aria-label="Delete FAQ" disabled={remove.isPending}>
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

      <FaqDialog openState={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
