import { Great_Vibes, Inter, Neucha, Nunito } from "next/font/google";

// Шрифти публічного вішліста (обидва оформлення), з кирилицею; вантажаться із самого сайту.
export const xmasTitle = Great_Vibes({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--wl-xmas-title" });
export const xmasText = Inter({ subsets: ["latin", "cyrillic"], variable: "--wl-xmas-text" });
export const giftTitle = Neucha({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--wl-gift-title" });
export const giftText = Nunito({ subsets: ["latin", "cyrillic"], variable: "--wl-gift-text" });
