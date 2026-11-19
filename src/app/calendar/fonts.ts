import { Inter, Lora } from "next/font/google";

// Оформлення «Папір»: заголовки із засічками, текст — Inter.
export const calTitle = Lora({ weight: ["500", "600"], subsets: ["latin", "cyrillic"], variable: "--cal-title" });
export const calText = Inter({ subsets: ["latin", "cyrillic"], variable: "--cal-text" });
