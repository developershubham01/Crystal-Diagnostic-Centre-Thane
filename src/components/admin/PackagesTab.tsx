"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { api, type PackageDTO } from "@/lib/api-client";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AdminField,
  DeleteConfirmDialog,
  EmptyState,
  ListSkeleton,
  mutationError,
  ResponsiveTableWrap,
  SwitchRow,
  TabHeader,
  useDebouncedValue,
} from "@/components/admin/admin-shared";

const QUERY_KEY = "admin-packages";

interface PackageDraft {
  name: string;
  slug: string;
  description: string;
  detailedDescription: string;
  preparation: string;
  applicability: string;
  price: string;
  priceVisible: boolean;
  featured: boolean;
  published: boolean;
  sortOrder: string;
  tests: string[];
}

const EMPTY_DRAFT: PackageDraft = {
  name: "",
  slug: "",
  description: "",
  detailedDescription: "",
  preparation: "",
  applicability: "",
  price: "",
  priceVisible: false,
  featured: false,
  published: true,
  sortOrder: "0",
  tests: [""],
};

function toDraft(p: PackageDTO): PackageDraft {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    detailedDescription: p.detailedDescription ?? "",
    preparation: p.preparation ?? "",
    applicability: p.applicability ?? "",
    price: p.price === null ? "" : String(p.price),
    priceVisible: p.priceVisible,
    featured: p.featured,
    published: p.published,
    sortOrder: String(p.sortOrder),
    tests: p.tests.length > 0 ? p.tests.map((t) => t.name) : [""],
  };
}

function TestsEditor({ tests, onChange }: { tests: string[]; onChange: (tests: string[]) => void }) {
  return (
    <div>
      <Label>Tests included in this package</Label>
      <p className="mt-0.5 text-xs text-inkmuted">Add each test name (e.g. CBC, Lipid Profile). Shown on the public package page.</p>
      <ul className="mt-2 space-y-2">
        {tests.map((test, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              value={test}
              onChange={(e) => onChange(tests.map((t, j) => (j === i ? e.target.value : t)))}
              placeholder={`Test ${i + 1}`}
              aria-label={`Test ${i + 1}`}
             
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-inkmuted hover:text-destructive"
              aria-label={`Remove test ${i + 1}`}
              disabled={tests.length === 1}
              onClick={() => onChange(tests.filter((_, j) => j !== i))}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onChange([...tests, ""])}>
        <Plus className="h-4 w-4" aria-hidden />
        Add test
      </Button>
    </div>
  );
}

function PackageDialog({
  openState,
  onClose,
}: {
  openState: { mode: "create" } | { mode: "edit"; pkg: PackageDTO } | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = openState?.mode === "edit" ? openState.pkg : null;

  const [draft, setDraft] = useState<PackageDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "price", string>>>({});

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): rebuild the draft each time the dialog opens.
  const [lastOpenState, setLastOpenState] = useState(openState);
  if (openState !== lastOpenState) {
    setLastOpenState(openState);
    if (openState) {
      setDraft(editing ? toDraft(editing) : { ...EMPTY_DRAFT });
      setFieldErrors({});
    }
  }

  function set<K extends keyof PackageDraft>(key: K, value: PackageDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in fieldErrors) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  const save = useMutation({
    mutationFn: () => {
      const priceTrimmed = draft.price.trim();
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        description: draft.description.trim() || null,
        detailedDescription: draft.detailedDescription.trim() || null,
        preparation: draft.preparation.trim() || null,
        applicability: draft.applicability.trim() || null,
        price: priceTrimmed === "" ? null : Number(priceTrimmed),
        priceVisible: draft.priceVisible,
        featured: draft.featured,
        published: draft.published,
        sortOrder: Number(draft.sortOrder) || 0,
        tests: draft.tests.map((t) => t.trim()).filter(Boolean),
      };
      return editing
        ? api.patch<PackageDTO>(`/api/packages/${editing.id}`, payload)
        : api.post<PackageDTO>("/api/packages", payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", saved.slug] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: editing ? "Package updated" : "Package created", description: saved.name });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    const errs: typeof fieldErrors = {};
    if (draft.name.trim().length < 2) errs.name = "Package name is required.";
    const p = draft.price.trim();
    if (p && (Number.isNaN(Number(p)) || Number(p) < 0)) errs.price = "Price must be a positive number.";
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    save.mutate();
  }

  return (
    <Dialog open={!!openState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-ink">{editing ? `Edit package — ${editing.name}` : "Add new health package"}</DialogTitle>
          <DialogDescription>Health packages group multiple tests at a package price.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="pkg-name" label="Package name" required error={fieldErrors.name}>
              <Input id="pkg-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Full Body Checkup" />
            </AdminField>
            <AdminField id="pkg-slug" label="URL slug" hint="Leave blank to auto-generate.">
              <Input id="pkg-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
            </AdminField>
          </div>

          <AdminField id="pkg-desc" label="Short description" hint="Shown on package cards.">
            <Input id="pkg-desc" value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </AdminField>

          <AdminField id="pkg-detail" label="Detailed description">
            <textarea
              id="pkg-detail"
              rows={3}
              value={draft.detailedDescription}
              onChange={(e) => set("detailedDescription", e.target.value)}
              className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
            />
          </AdminField>

          <TestsEditor tests={draft.tests} onChange={(tests) => set("tests", tests)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="pkg-prep" label="Preparation">
              <Input id="pkg-prep" value={draft.preparation} onChange={(e) => set("preparation", e.target.value)} placeholder="e.g. Fasting 10–12 hrs" />
            </AdminField>
            <AdminField id="pkg-appl" label="Applicability" hint="e.g. Adults 18+, both genders.">
              <Input id="pkg-appl" value={draft.applicability} onChange={(e) => set("applicability", e.target.value)} />
            </AdminField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="pkg-price" label="Price (₹)" error={fieldErrors.price}>
              <Input id="pkg-price" type="number" min="0" inputMode="decimal" value={draft.price} onChange={(e) => set("price", e.target.value)} />
            </AdminField>
            <AdminField id="pkg-sort" label="Sort order">
              <Input id="pkg-sort" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </AdminField>
          </div>

          <div className="border border-amber-200 bg-amber-50 px-4 py-3">
            <label htmlFor="pkg-pricevisible" className="flex cursor-pointer items-start justify-between gap-3">
              <span className="text-sm font-semibold text-amber-900">
                Show price publicly
                <span className="mt-0.5 block text-xs font-normal text-amber-700">
                  Warning: package prices are sample/demo data until the client confirms them. Keep this off unless approved.
                </span>
              </span>
              <Switch id="pkg-pricevisible" checked={draft.priceVisible} onCheckedChange={(v) => set("priceVisible", v)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchRow id="pkg-featured" label="Featured" note="Highlighted on the home page." checked={draft.featured} onCheckedChange={(v) => set("featured", v)} />
            <SwitchRow id="pkg-published" label="Published" note="Visible on the public site." checked={draft.published} onCheckedChange={(v) => set("published", v)} />
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
              "Create package"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PackagesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; pkg: PackageDTO } | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const list = useQuery<PackageDTO[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => api.get<PackageDTO[]>("/api/packages?all=1"),
  });

  const packages = useMemo(() => {
    const data = list.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((p) => [p.name, p.slug].join(" ").toLowerCase().includes(q));
  }, [list.data, debouncedSearch]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["packages"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const toggle = useMutation({
    mutationFn: ({ pkg, patch }: { pkg: PackageDTO; patch: Record<string, boolean> }) =>
      api.patch<PackageDTO>(`/api/packages/${pkg.id}`, patch),
    onSuccess: (updated, vars) => {
      invalidate();
      toast({
        title:
          vars.patch.published !== undefined
            ? `${updated.name} ${updated.published ? "published" : "unpublished"}`
            : `${updated.name} ${updated.featured ? "marked as featured" : "removed from featured"}`,
      });
    },
    onError: (err) => {
      invalidate();
      mutationError(err, toast, "Update failed");
    },
  });

  const remove = useMutation({
    mutationFn: (pkg: PackageDTO) => api.delete(`/api/packages/${pkg.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Package deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="Health Packages"
        description="Preventive packages combining multiple tests. Package contents are sample data until confirmed by the centre."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Package
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
        <Input
          type="search"
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search packages"
        />
      </div>

      {list.isLoading ? (
        <ListSkeleton rows={5} />
      ) : list.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load packages. Please refresh.</CardContent>
        </Card>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" aria-hidden />}
          title={search ? "No packages match your search" : "No packages yet"}
          hint={search ? undefined : "Create the first health package, e.g. Full Body Checkup."}
        />
      ) : (
        <ResponsiveTableWrap>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                <th scope="col" className="px-4 py-3 font-bold">Package</th>
                <th scope="col" className="px-4 py-3 font-bold">Tests</th>
                <th scope="col" className="px-4 py-3 font-bold">Price</th>
                <th scope="col" className="px-4 py-3 font-bold">Featured</th>
                <th scope="col" className="px-4 py-3 font-bold">Published</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/60">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">{p.name}</p>
                    <p className="max-w-xs truncate text-xs text-inkmuted">{p.description ?? `/${p.slug}`}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{p.tests.length}</td>
                  <td className="px-4 py-3">
                    {p.price === null ? (
                      <span className="text-xs text-inkmuted">{p.priceVisible ? "Not set" : "Hidden"}</span>
                    ) : (
                      <span className="font-semibold text-ink">
                        ₹{p.price.toLocaleString("en-IN")}
                        <span className="ml-1 text-[10px] font-bold text-teal-800">{p.priceVisible ? "PUBLIC" : "INTERNAL"}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${p.featured ? "text-amber-500" : "text-inkmuted hover:text-amber-500"}`}
                      aria-label={p.featured ? `Remove ${p.name} from featured` : `Mark ${p.name} as featured`}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ pkg: p, patch: { featured: !p.featured } })}
                    >
                      <Star className={`h-4 w-4 ${p.featured ? "fill-amber-400" : ""}`} aria-hidden />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={p.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ pkg: p, patch: { published: v } })}
                      aria-label={`${p.published ? "Unpublish" : "Publish"} ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-medblue hover:text-ink" aria-label={`Edit ${p.name}`} onClick={() => setDialog({ mode: "edit", pkg: p })}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteConfirmDialog
                        title={`Delete “${p.name}”?`}
                        description="This permanently removes the package from the website."
                        onConfirm={() => remove.mutate(p)}
                        disabled={remove.isPending}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" aria-label={`Delete ${p.name}`} disabled={remove.isPending}>
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

      <PackageDialog openState={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
