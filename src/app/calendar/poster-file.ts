// Перевірка картинки-афіші, що прийшла з форми чи CLI.

export const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const POSTER_MAX_BYTES = 3 * 1024 * 1024;

export async function posterFromFile(file: unknown): Promise<{ mime: string; data: Buffer } | { error: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!POSTER_TYPES.includes(file.type)) return { error: "Афіша має бути картинкою (JPEG, PNG, WebP чи GIF)" };
  if (file.size > POSTER_MAX_BYTES) return { error: "Картинка завелика — до 3 МБ" };
  return { mime: file.type, data: Buffer.from(await file.arrayBuffer()) };
}
