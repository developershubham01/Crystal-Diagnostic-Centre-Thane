"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Trash2,
  UploadCloud,
  Link2,
} from "lucide-react";
import { api, ApiError, type GalleryImageDTO } from "@/lib/api-client";
import { GALLERY_CATEGORIES } from "@/lib/constants";
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
  SwitchRow,
  TabHeader,
} from "@/components/admin/admin-shared";

const QUERY_KEY = "admin-gallery";

interface GalleryDraft {
  title: string;
  category: string;
  url: string;
  alt: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY_DRAFT: GalleryDraft = {
  title: "",
  category: GALLERY_CATEGORIES[0],
  url: "",
  alt: "",
  sortOrder: "0",
  published: true,
};

function GalleryDialog({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: GalleryImageDTO | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<GalleryDraft>(EMPTY_DRAFT);
  const [uploading, setUploading] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);

  // Adjust state during render (React-recommended replacement for the old
  // useEffect): rebuild the draft each time the dialog opens.
  const [lastOpenState, setLastOpenState] = useState(open);
  if (open !== lastOpenState) {
    setLastOpenState(open);
    if (open) {
      setDraft(
        editing
          ? {
              title: editing.title,
              category: editing.category,
              url: editing.url,
              alt: editing.alt ?? "",
              sortOrder: String(editing.sortOrder),
              published: editing.published,
            }
          : { ...EMPTY_DRAFT }
      );
      setTitleError(undefined);
    }
  }

  function set<K extends keyof GalleryDraft>(key: K, value: GalleryDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "title") setTitleError(undefined);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new ApiError(data.error ?? "Upload failed. Please try again.", res.status);
      }
      set("url", data.url);
      toast({ title: "Image uploaded", description: "Compression and resizing are handled automatically." });
    } catch (err) {
      mutationError(err, toast, "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        title: draft.title.trim(),
        category: draft.category,
        url: draft.url.trim(),
        alt: draft.alt.trim() || null,
        sortOrder: Number(draft.sortOrder) || 0,
        published: draft.published,
      };
      return editing
        ? api.patch<GalleryImageDTO>(`/api/gallery/${editing.id}`, payload)
        : api.post<GalleryImageDTO>("/api/gallery", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: editing ? "Image updated" : "Image added to gallery" });
      onClose();
    },
    onError: (err) => mutationError(err, toast, "Save failed"),
  });

  function handleSave() {
    if (draft.title.trim().length < 2) {
      setTitleError("Please enter a title.");
      return;
    }
    if (!draft.url.trim()) {
      toast({ title: "Image required", description: "Upload a file or paste an image URL first.", variant: "destructive" });
      return;
    }
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">{editing ? "Edit gallery image" : "Add gallery image"}</DialogTitle>
          <DialogDescription>
            Uploaded images are compressed and resized to max 1600px (WebP) automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload / URL */}
          <div className="rounded-xl border border-dashed border-brandborder bg-soft/50 p-4">
            <Label htmlFor="gallery-file" className="flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4 text-medblue" aria-hidden />
              Upload image file
            </Label>
            <Input
              ref={fileInputRef}
              id="gallery-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="mt-1.5 cursor-pointer rounded-xl"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <p className="mt-1 text-xs text-inkmuted">JPG, PNG, WebP or SVG up to 6 MB.</p>

            <div className="my-3 flex items-center gap-3 text-xs font-semibold text-inkmuted">
              <span className="h-px flex-1 bg-brandborder" />
              or paste a URL
              <span className="h-px flex-1 bg-brandborder" />
            </div>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
              <Input
                value={draft.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="/uploads/example.webp"
                aria-label="Image URL"
                className="rounded-xl pl-9"
              />
            </div>

            {draft.url && (
              <div className="mt-3 overflow-hidden rounded-xl border border-brandborder bg-card">
                { }
                <img
                  src={draft.url}
                  alt="Preview of the selected gallery image"
                  className="mx-auto max-h-44 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <AdminField id="gallery-title" label="Title" required error={titleError}>
            <Input id="gallery-title" value={draft.title} onChange={(e) => set("title", e.target.value)} className="rounded-xl" placeholder="e.g. Reception area" />
          </AdminField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="gallery-category" label="Category">
              <Select value={draft.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="gallery-category" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminField>
            <AdminField id="gallery-sort" label="Sort order">
              <Input id="gallery-sort" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="rounded-xl" />
            </AdminField>
          </div>

          <AdminField id="gallery-alt" label="Alt text" hint="Describe the image for screen readers and SEO.">
            <Input id="gallery-alt" value={draft.alt} onChange={(e) => set("alt", e.target.value)} className="rounded-xl" placeholder="e.g. Clean reception desk with seating area" />
          </AdminField>

          <SwitchRow id="gallery-published" label="Published" note="Visible in the public gallery." checked={draft.published} onCheckedChange={(v) => set("published", v)} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={handleSave} disabled={save.isPending || uploading}>
            {save.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Add to gallery"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GalleryTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryImageDTO | null>(null);

  const list = useQuery<GalleryImageDTO[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => api.get<GalleryImageDTO[]>("/api/gallery?all=1"),
  });

  const images = useMemo(() => list.data ?? [], [list.data]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const toggle = useMutation({
    mutationFn: ({ image, published }: { image: GalleryImageDTO; published: boolean }) =>
      api.patch<GalleryImageDTO>(`/api/gallery/${image.id}`, { published }),
    onSuccess: (updated) => {
      invalidate();
      toast({ title: `“${updated.title}” ${updated.published ? "published" : "unpublished"}` });
    },
    onError: (err) => {
      invalidate();
      mutationError(err, toast, "Update failed");
    },
  });

  const remove = useMutation({
    mutationFn: (image: GalleryImageDTO) => api.delete(`/api/gallery/${image.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Image deleted" });
    },
    onError: (err) => mutationError(err, toast, "Delete failed"),
  });

  return (
    <div>
      <TabHeader
        title="Gallery"
        description="Photos of the centre, reception, facilities and equipment shown on the public gallery page."
        actions={
          <Button
            className="rounded-xl"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Add Image
          </Button>
        }
      />

      {list.isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.isError ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-0">
          <CardContent className="p-5 text-sm font-medium text-destructive">Could not load the gallery. Please refresh.</CardContent>
        </Card>
      ) : images.length === 0 ? (
        <EmptyState
          icon={<Images className="h-10 w-10" aria-hidden />}
          title="No gallery images yet"
          hint="Upload photos of the centre to build the public gallery."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <li key={img.id}>
              <Card className={`h-full rounded-2xl border-brandborder p-0 ${img.published ? "" : "opacity-80"}`}>
                <div className="relative overflow-hidden rounded-t-2xl bg-soft">
                  { }
                  <img
                    src={img.url}
                    alt={img.alt ?? img.title}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                  {!img.published && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      DRAFT
                    </span>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{img.title}</p>
                      <p className="text-xs text-inkmuted">{img.category}</p>
                    </div>
                    <Switch
                      checked={img.published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ image: img, published: v })}
                      aria-label={`${img.published ? "Unpublish" : "Publish"} ${img.title}`}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-medblue hover:text-ink"
                      onClick={() => {
                        setEditing(img);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Button>
                    <DeleteConfirmDialog
                      title={`Delete “${img.title}”?`}
                      description="This removes the image from the public gallery. The uploaded file itself stays on the server."
                      onConfirm={() => remove.mutate(img)}
                      disabled={remove.isPending}
                    >
                      <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:bg-destructive/5" disabled={remove.isPending}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <GalleryDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
