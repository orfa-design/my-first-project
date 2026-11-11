import type { ReactNode } from "react";
import type { WishItem } from "@/lib/types";
import { Prose } from "./ui";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Картка бажання. actions — кнопки керування (лише на сторінці за паролем). */
export function WishCard({ item, actions }: { item: WishItem; actions?: ReactNode }) {
  return (
    <li className={`card p-4 ${item.is_hidden ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        {item.image_url && (
          // Зовнішня картинка магазину — звичайний <img>, без оптимізації Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" referrerPolicy="no-referrer" className="h-16 w-16 shrink-0 rounded border border-border bg-surface-muted object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {item.priority === "high" && <span className="mr-1.5" title="Дуже хочу">★</span>}
            {item.title}
          </div>
          {item.price && <div className="text-sm text-muted">{item.price}</div>}
          {item.priority === "low" && <div className="text-xs text-muted">запасний варіант</div>}
        </div>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="btn-secondary shrink-0">
            Переглянути на {host(item.url)} ↗
          </a>
        )}
      </div>
      {item.note && (
        <div className="mt-2 text-muted">
          <Prose>{item.note}</Prose>
        </div>
      )}
      {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{actions}</div>}
    </li>
  );
}
