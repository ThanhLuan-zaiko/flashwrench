"use client";

import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { ProductQuickViewDialog } from "./ProductQuickViewDialog";
import { ProductsPager } from "./ProductsPager";
import type { ProductsPage } from "./products-utils";

type ProductsResultsProps = {
  view: ProductsPage;
  hrefFor: (page: number) => string;
};

// Success branch of the shelf: the card grid, the numbered pager and one
// shared quick-view sheet. The eye on each card points the dialog at that
// part; if a realtime update drops it from the page the sheet closes.
export function ProductsResults({ view, hrefFor }: ProductsResultsProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = view.pageItems.find((part) => part.id === previewId) ?? null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div
        data-tour="products-grid"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
      >
        {view.pageItems.map((part) => (
          <ProductCard
            key={part.id}
            part={part}
            onPreview={() => setPreviewId(part.id)}
          />
        ))}
      </div>
      <ProductsPager
        page={view.safePage}
        pageCount={view.pageCount}
        start={view.start}
        end={view.end}
        total={view.total}
        hrefFor={hrefFor}
      />
      {preview && (
        <ProductQuickViewDialog
          key={preview.id}
          part={preview}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}
