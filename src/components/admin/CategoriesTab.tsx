"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { api, type CategoryDTO } from "@/lib/api-client";
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
  useAdminCategories,
} from "@/components/admin/admin-shared";

interface CategoryDraft {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY_DRAFT: CategoryDraft = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: "0",
  published: true,
};

function CategoryDialog({
  openState,
  onClose,
}: {
  openState: { mode: "create" } | { mode: "edit"; category: CategoryDTO } | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = openState?.mode === "edit" ? openState.category : null;

  const [draft, setDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

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
              slug: editing.slug,
              description: editing.description ?? "",
              icon: editing.icon ?? "",
              sortOrder: String(editing.sortOrder),
              published: editing.published,
            }
          : { ...EMPTY_DRAFT }
      );
      setNameError(undefined);
    }
  }

  function set<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "name") setNameError(undefined);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        description: draft.description.trim() || null,
        icon: draft.icon.trim() || null,
        sortOrder: Number(draft.sortOrder) || 0,
        published: draft.published,
      };
      return editing
        ? api.patch<CategoryDTO>(`/api/categories/${editing.id}`, payload)
        : api.post<CategoryDTO>("/api/categories", payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: editing ? "Category updated" : "Category created", description: saved.name });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    if (draft.name.trim().length < 2) {
      setNameError("Category name is required.");
      return;
    }
    save.mutate();
  }

  return (
    <Dialog open={!!openState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">{editing ? `Edit category — ${editing.name}` : "Add new category"}</DialogTitle>
          <DialogDescription>Categories group services on the public site.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AdminField id="cat-name" label="Category name" required error={nameError}>
            <Input id="cat-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pathology" />
          </AdminField>
          <AdminField id="cat-slug" label="URL slug" hint="Leave blank to auto-generate from the name.">
            <Input id="cat-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. pathology" />
          </AdminField>
          <AdminField id="cat-desc" label="Description">
            <textarea
              id="cat-desc"
              rows={3}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="cat-icon" label="Icon" hint="Short label, e.g. flask or microscope.">
              <Input id="cat-icon" value={draft.icon} onChange={(e) => set("icon", e.target.value)} />
            </AdminField>
            <AdminField id="cat-sort" label="Sort order" hint="Lower numbers appear first.">
              <Input id="cat-sort" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </AdminField>
          </div>
          <div className="flex items-start justify-between gap-4 border border-brandborder bg-soft/50 px-4 py-3">
            <div>
              <label htmlFor="cat-published" className="text-sm font-semibold text-ink">
                Published
              </label>
              <p className="mt-0.5 text-xs text-inkmuted">Visible on the public site.</p>
            </div>
            <Switch id="cat-published" checked={draft.published} onCheckedChange={(v) => set("published", v)} />
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
              "Create category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; category: CategoryDTO } | null>(null);
  // Categories that are known but not returned by the public list (unpublished).
  const [unpublishedExtras, setUnpublishedExtras] = useState<CategoryDTO[]>([]);

  const categories = useAdminCategories();

  const allCategories = useMemo(() => {
    const fetched = categories.data ?? [];
    const ids = new Set(fetched.map((c) => c.id));
    const extras = unpublishedExtras.filter((c) => !ids.has(c.id));
    return [...fetched, ...extras].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories.data, unpublishedExtras]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const toggle = useMutation({
    mutationFn: ({ category, published }: { category: CategoryDTO; published: boolean }) =>
      api.patch<CategoryDTO>(`/api/categories/${category.id}`, { published }),
    onSuccess: (updated) => {
      if (!updated.published) {
        // Public list won't include it anymore — remember it locally so it stays editable.
        setUnpublishedExtras((prev) => [...prev.filter((c) => c.id !== updated.id), updated]);
      } else {
        setUnpublishedExtras((prev) => prev.filter((c) => c.id !== updated.id));
      }
      invalidate();
      toast({ title: `${updated.name} ${updated.published ? "published" : "unpublished"}` });
    },
    onError: (err) => mutationError(err, toast, "Update failed"),
  });

  const remove = useMutation({
    mutationFn: (category: CategoryDTO) => api.delete(`/api/categories/${category.id}`),
    onSuccess: (_res, category) => {
      setUnpublishedExtras((prev) => prev.filter((c) => c.id !== category.id));
      invalidate();
      toast({ title: "Category deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="Categories"
        description="Service categories shown on the public services page."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Category
          </Button>
        }
      />

      {categories.isLoading ? (
        <ListSkeleton rows={4} />
      ) : categories.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load categories. Please refresh.</CardContent>
        </Card>
      ) : allCategories.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-10 w-10" aria-hidden />}
          title="No categories yet"
          hint="Create a category such as Pathology or Radiology before adding services."
        />
      ) : (
        <ResponsiveTableWrap>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                <th scope="col" className="px-4 py-3 font-bold">Category</th>
                <th scope="col" className="px-4 py-3 font-bold">Icon</th>
                <th scope="col" className="px-4 py-3 font-bold">Sort</th>
                <th scope="col" className="px-4 py-3 font-bold">Services</th>
                <th scope="col" className="px-4 py-3 font-bold">Published</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {allCategories.map((c) => (
                <tr key={c.id} className="border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/60">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">
                      {c.name}
                      {!c.published && (
                        <span className="ml-2 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          DRAFT
                        </span>
                      )}
                    </p>
                    <p className="max-w-md truncate text-xs text-inkmuted">{c.description ?? `/${c.slug}`}</p>
                  </td>
                  <td className="px-4 py-3 text-inkmuted">{c.icon ?? "—"}</td>
                  <td className="px-4 py-3 text-inkmuted">{c.sortOrder}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{c.serviceCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={c.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ category: c, published: v })}
                      aria-label={`${c.published ? "Unpublish" : "Publish"} ${c.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-medblue hover:text-ink" aria-label={`Edit ${c.name}`} onClick={() => setDialog({ mode: "edit", category: c })}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteConfirmDialog
                        title={`Delete “${c.name}”?`}
                        description="Categories with services cannot be deleted — move or delete their services first."
                        onConfirm={() => remove.mutate(c)}
                        disabled={remove.isPending}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" aria-label={`Delete ${c.name}`} disabled={remove.isPending}>
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

      <CategoryDialog openState={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
