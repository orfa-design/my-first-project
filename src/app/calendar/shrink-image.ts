/**
 * Зменшує фото перед завантаженням (до 1600 px по довшій стороні, JPEG): фото з телефона важать
 * кілька мегабайт, а для афіші в календарі цього забагато. Якщо зменшити не вдалося — повертає як є.
 */
export async function shrinkImage(file: File, max = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** Підміняє вибраний у полі файл зменшеною копією. */
export async function shrinkInputFile(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  if (!file) return;
  const small = await shrinkImage(file);
  if (small === file) return;
  const dt = new DataTransfer();
  dt.items.add(small);
  input.files = dt.files;
}
