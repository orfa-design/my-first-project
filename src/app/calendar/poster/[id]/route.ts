import { requireSession } from "@/lib/auth";
import { getPoster } from "@/lib/data/calendar";
import { isUuid } from "@/lib/ids";

// Зображення події (обкладинка, фото). Сторінка за паролем (proxy), тут — друга перевірка.
export async function GET(_request: Request, { params }: RouteContext<"/calendar/poster/[id]">) {
  await requireSession();
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const poster = await getPoster(id);
  if (!poster) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(poster.data), {
    headers: {
      "content-type": poster.mime,
      // Адреса містить ?v=<час оновлення>, тож картинку можна кешувати надовго.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
