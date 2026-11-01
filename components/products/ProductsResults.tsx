"use client";

import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { ProductQuickViewDialog } from "./ProductQuickViewDialog";
import { ProductsPager } from "./ProductsPager";
import { productCellLayout } from "./products-grid-layout";
import type { ProductsPage } from "./products-utils";

type ProductsResultsProps = {
  view: ProductsPage;
  hrefFor: (page: number) => string;
};

// Success branch of the shelf: the tile grid, the pager and one shared
// quick-view sheet. The "Xem nhanh" link on each tile points the dialog at that
// part; if a realtime update drops it from the page the sheet closes.
export function ProductsResults({ view, hrefFor }: ProductsResultsProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = view.pageItems.find((part) => part.id === previewId) ?? null;
  const count = view.pageItems.length;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <ul
        data-tour="products-grid"
        className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5"
      >
        {view.pageItems.map((part, index) => {
          const cell = productCellLayout(index, count);
          return (
            <li key={part.id} className={cell.span}>
              <ProductCard
                part={part}
                layout={cell.tile}
                onPreview={() => setPreviewId(part.id)}
              />
            </li>
          );
        })}
      </ul>
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
