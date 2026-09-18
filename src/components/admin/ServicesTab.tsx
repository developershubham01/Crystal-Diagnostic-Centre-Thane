"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Star, Stethoscope, Trash2 } from "lucide-react";
import { api, type ServiceDTO } from "@/lib/api-client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminField,
  DeleteConfirmDialog,
  EmptyState,
  ListSkeleton,
  mutationError,
  ResponsiveTableWrap,
  SwitchRow,
  TabHeader,
  useAdminCategories,
  useDebouncedValue,
} from "@/components/admin/admin-shared";
import { cn } from "@/lib/utils";

const QUERY_KEY = "admin-services";

interface ServiceDraft {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  detailedDescription: string;
  preparation: string;
  sampleType: string;
  turnaroundTime: string;
  price: string;
  priceVisible: boolean;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_DRAFT: ServiceDraft = {
  name: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  detailedDescription: "",
  preparation: "",
  sampleType: "",
  turnaroundTime: "",
  price: "",
  priceVisible: false,
  featured: false,
  published: true,
  seoTitle: "",
  seoDescription: "",
};

function toDraft(s: ServiceDTO): ServiceDraft {
  return {
    name: s.name,
    slug: s.slug,
    categoryId: s.categoryId,
    shortDescription: s.shortDescription ?? "",
    detailedDescription: s.detailedDescription ?? "",
    preparation: s.preparation ?? "",
    sampleType: s.sampleType ?? "",
    turnaroundTime: s.turnaroundTime ?? "",
    price: s.price === null ? "" : String(s.price),
    priceVisible: s.priceVisible,
    featured: s.featured,
    published: s.published,
    seoTitle: s.seoTitle ?? "",
    seoDescription: s.seoDescription ?? "",
  };
}

function ServiceDialog({
  openState,
  categories,
  onClose,
}: {
  openState: { mode: "create" } | { mode: "edit"; service: ServiceDTO } | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = openState?.mode === "edit" ? openState.service : null;

  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "categoryId" | "price", string>>>({});

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): rebuild the draft each time the dialog opens.
  const [lastOpenState, setLastOpenState] = useState(openState);
  if (openState !== lastOpenState) {
    setLastOpenState(openState);
    if (openState) {
      setDraft(editing ? toDraft(editing) : { ...EMPTY_DRAFT, published: true });
      setFieldErrors({});
    }
  }

  function set<K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key in fieldErrors) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  const save = useMutation({
    mutationFn: () => {
      const priceTrimmed = draft.price.trim();
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        categoryId: draft.categoryId,
        shortDescription: draft.shortDescription.trim() || null,
        detailedDescription: draft.detailedDescription.trim() || null,
        preparation: draft.preparation.trim() || null,
        sampleType: draft.sampleType.trim() || null,
        turnaroundTime: draft.turnaroundTime.trim() || null,
        price: priceTrimmed === "" ? null : Number(priceTrimmed),
        priceVisible: draft.priceVisible,
        featured: draft.featured,
        published: draft.published,
        seoTitle: draft.seoTitle.trim() || null,
        seoDescription: draft.seoDescription.trim() || null,
      };
      return editing
        ? api.patch<ServiceDTO>(`/api/services/${editing.id}`, payload)
        : api.post<ServiceDTO>("/api/services", payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", saved.slug] });
      toast({ title: editing ? "Service updated" : "Service created", description: saved.name });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    const errs: typeof fieldErrors = {};
    if (draft.name.trim().length < 2) errs.name = "Service name is required.";
    if (!draft.categoryId) errs.categoryId = "Choose a category.";
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
          <DialogTitle className="text-ink">{editing ? `Edit service — ${editing.name}` : "Add new service"}</DialogTitle>
          <DialogDescription>
            Service details appear on the public site. Leave optional fields blank if not applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField id="svc-name" label="Service name" required error={fieldErrors.name}>
            <Input id="svc-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </AdminField>
          <AdminField id="svc-slug" label="URL slug" hint="Leave blank to auto-generate from the name.">
            <Input id="svc-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. complete-blood-count" />
          </AdminField>
        </div>

        <AdminField id="svc-category" label="Category" required error={fieldErrors.categoryId}>
          <Select value={draft.categoryId} onValueChange={(v) => set("categoryId", v)}>
            <SelectTrigger id="svc-category" className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminField>

        <AdminField id="svc-short" label="Short description" hint="One line shown on cards and lists.">
          <Input id="svc-short" value={draft.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        </AdminField>

        <AdminField id="svc-detail" label="Detailed description">
          <textarea
            id="svc-detail"
            rows={3}
            value={draft.detailedDescription}
            onChange={(e) => set("detailedDescription", e.target.value)}
            className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField id="svc-prep" label="Preparation">
            <Input id="svc-prep" value={draft.preparation} onChange={(e) => set("preparation", e.target.value)} placeholder="e.g. Fasting 8–10 hrs" />
          </AdminField>
          <AdminField id="svc-sample" label="Sample type">
            <Input id="svc-sample" value={draft.sampleType} onChange={(e) => set("sampleType", e.target.value)} placeholder="e.g. Blood" />
          </AdminField>
          <AdminField id="svc-tat" label="Report turnaround">
            <Input id="svc-tat" value={draft.turnaroundTime} onChange={(e) => set("turnaroundTime", e.target.value)} placeholder="e.g. Same day" />
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField id="svc-price" label="Price (₹)" error={fieldErrors.price} hint="Stored internally — only shown publicly when the switch below is on.">
            <Input id="svc-price" type="number" min="0" inputMode="decimal" value={draft.price} onChange={(e) => set("price", e.target.value)} />
          </AdminField>
          <div className="flex items-end">
            <div className="w-full border border-amber-200 bg-amber-50 px-4 py-3">
              <label htmlFor="svc-pricevisible" className="flex cursor-pointer items-start justify-between gap-3">
                <span className="text-sm font-semibold text-amber-900">
                  Show price publicly
                  <span className="block text-xs font-normal text-amber-700">
                    (client approval required before enabling)
                  </span>
                </span>
                <Switch id="svc-pricevisible" checked={draft.priceVisible} onCheckedChange={(v) => set("priceVisible", v)} />
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchRow id="svc-featured" label="Featured" note="Highlighted on the home page." checked={draft.featured} onCheckedChange={(v) => set("featured", v)} />
          <SwitchRow id="svc-published" label="Published" note="Visible on the public site." checked={draft.published} onCheckedChange={(v) => set("published", v)} />
        </div>

        <details className="border border-brandborder bg-soft/50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-ink">SEO fields (optional)</summary>
          <div className="mt-3 space-y-4">
            <AdminField id="svc-seotitle" label="SEO title">
              <Input id="svc-seotitle" value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </AdminField>
            <AdminField id="svc-seodesc" label="SEO description">
              <textarea
                id="svc-seodesc"
                rows={2}
                value={draft.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                className="flex w-full border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-inkmuted focus-visible:outline-2 focus-visible:outline-medblue"
              />
            </AdminField>
          </div>
        </details>

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
              "Create service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; service: ServiceDTO } | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const list = useQuery<ServiceDTO[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => api.get<ServiceDTO[]>("/api/services?all=1"),
  });

  const categories = useAdminCategories();

  const services = useMemo(() => {
    const data = list.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((s) =>
      [s.name, s.slug, s.category?.name ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [list.data, debouncedSearch]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const toggle = useMutation({
    mutationFn: ({ service, patch }: { service: ServiceDTO; patch: Record<string, boolean> }) =>
      api.patch<ServiceDTO>(`/api/services/${service.id}`, patch),
    onSuccess: (updated, vars) => {
      invalidate();
      toast({
        title: vars.patch.published !== undefined
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
    mutationFn: (service: ServiceDTO) => api.delete(`/api/services/${service.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Service deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="Services"
        description="Diagnostic tests offered by the centre. Unpublished services stay hidden from the public site."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Service
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
        <Input
          type="search"
          placeholder="Search services…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search services"
        />
      </div>

      {list.isLoading ? (
        <ListSkeleton rows={6} />
      ) : list.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load services. Please refresh.</CardContent>
        </Card>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-10 w-10" aria-hidden />}
          title={search ? "No services match your search" : "No services yet"}
          hint={search ? undefined : "Add the first diagnostic service to show it on the public site."}
        />
      ) : (
        <ResponsiveTableWrap>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-brandborder bg-soft/60 text-[11px] uppercase tracking-wide text-inkmuted">
                <th scope="col" className="px-4 py-3 font-bold">Service</th>
                <th scope="col" className="px-4 py-3 font-bold">Category</th>
                <th scope="col" className="px-4 py-3 font-bold">Price</th>
                <th scope="col" className="px-4 py-3 font-bold">Featured</th>
                <th scope="col" className="px-4 py-3 font-bold">Published</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-brandborder/70 transition-colors last:border-0 hover:bg-soft/60">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">{s.name}</p>
                    <p className="text-xs text-inkmuted">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{s.category?.name ?? <span className="text-inkmuted">—</span>}</td>
                  <td className="px-4 py-3">
                    {s.price === null ? (
                      <span className="text-xs text-inkmuted">{s.priceVisible ? "Not set" : "Hidden"}</span>
                    ) : (
                      <span className="font-semibold text-ink">
                        ₹{s.price.toLocaleString("en-IN")}
                        <span className="ml-1 text-[10px] font-bold text-teal-800">{s.priceVisible ? "PUBLIC" : "INTERNAL"}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(s.featured ? "text-amber-500" : "text-inkmuted hover:text-amber-500")}
                      aria-label={s.featured ? `Remove ${s.name} from featured` : `Mark ${s.name} as featured`}
                      title={s.featured ? "Featured — click to unmark" : "Mark as featured"}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ service: s, patch: { featured: !s.featured } })}
                    >
                      <Star className={cn("h-4 w-4", s.featured && "fill-amber-400")} aria-hidden />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={s.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ service: s, patch: { published: v } })}
                      aria-label={`${s.published ? "Unpublish" : "Publish"} ${s.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-medblue hover:text-ink" aria-label={`Edit ${s.name}`} onClick={() => setDialog({ mode: "edit", service: s })}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <DeleteConfirmDialog
                        title={`Delete “${s.name}”?`}
                        description="This permanently removes the service from the website. Consider unpublishing instead to keep the data."
                        onConfirm={() => remove.mutate(s)}
                        disabled={remove.isPending}
                      >
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" aria-label={`Delete ${s.name}`} disabled={remove.isPending}>
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

      <ServiceDialog
        openState={dialog}
        categories={categories.data ?? []}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
