import { DeletePhotoButton } from "@/components/delete-photo-button";

type Photo = {
  id: string;
  /** URL assinada (produção) ou data URL (dev fallback). */
  url: string;
  fileName: string;
};

export function PhotoGallery({
  photos,
  canDelete = true,
  emptyText = "Nenhuma foto anexada.",
}: {
  photos: Photo[];
  canDelete?: boolean;
  emptyText?: string;
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id} className="relative overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.fileName}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover"
          />
          {canDelete ? <DeletePhotoButton attachmentId={photo.id} /> : null}
        </li>
      ))}
    </ul>
  );
}