import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Друга лінія захисту для серверних дій: proxy вже перевіряє сесію,
 * але дії не повинні покладатися лише на нього.
 */
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    throw new Error("Потрібно увійти");
  }
}
