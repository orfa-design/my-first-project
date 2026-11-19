import { Inter, Lora } from "next/font/google";

// Оформлення «Папір»: заголовки із засічками, текст — Inter.
// Lora — змінний шрифт: без переліку товщин (запит із кількома товщинами ламає збірку на Vercel).
export const calTitle = Lora({ subsets: ["latin", "cyrillic"], variable: "--cal-title" });
export const calText = Inter({ subsets: ["latin", "cyrillic"], variable: "--cal-text" });
