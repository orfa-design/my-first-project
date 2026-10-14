# Study Hub

Особистий вебзастосунок для навчання на заочній формі: предмети, завдання, дедлайни,
статуси здачі та відлік до сесії. Дані додаються переважно через чат із Claude Code
(див. `CLAUDE.md`), а сайт — щоб переглядати, шукати й виправляти.

**Стан:** етап 1 з 3 — семестри, предмети, завдання, головна сторінка, CLI для AI.
Далі: розклад і журнал оцінювання (етап 2), матеріали, база знань і пошук (етап 3).
Деталі — `docs/SPEC.md`.

## Налаштування (одноразово)

### 1. База даних — Supabase

1. Створіть проєкт на [supabase.com](https://supabase.com) (безкоштовного тарифу достатньо).
   Регіон — найближчий, наприклад Frankfurt.
2. **Project Settings → Database → Connection string → Transaction pooler** — скопіюйте рядок
   (порт `6543`) і підставте пароль бази. Це `DATABASE_URL`.

### 2. Сайт — Vercel

1. На [vercel.com](https://vercel.com) → **Add New → Project** → імпортуйте цей репозиторій з GitHub.
2. У **Environment Variables** додайте:

   | Змінна | Значення |
   | --- | --- |
   | `DATABASE_URL` | рядок із Supabase |
   | `APP_PASSWORD` | пароль для входу на сайт |
   | `SESSION_SECRET` | випадковий рядок ≥ 32 символів |
   | `HUB_TOKEN` | інший випадковий рядок ≥ 32 символів (для AI) |

   Випадковий рядок: `openssl rand -hex 32`.
3. **Deploy.** Адреса сайту буде на кшталт `https://study-hub-xxx.vercel.app`.

### 3. Таблиці в базі

Один раз (і після кожної нової міграції) з комп'ютера, де є Node.js:

```bash
npm install
DATABASE_URL='рядок із Supabase' npm run db:migrate
```

або вставте вміст файлів `db/migrations/*.sql` по черзі в **Supabase → SQL Editor**
(тоді міграції не позначаються як застосовані — обирайте один спосіб).

### 4. Доступ для Claude Code

У хмарних сесіях Claude Code немає прямого доступу до бази (лише HTTPS), тому AI працює
через сайт:

1. У налаштуваннях середовища Claude Code (меню середовища в заголовку сесії → **Edit**):
   - **Environment variables:** `HUB_URL=https://<ваш-сайт>.vercel.app` і `HUB_TOKEN=<те саме, що у Vercel>`;
   - **Network access:** додайте домен сайту (`<ваш-сайт>.vercel.app`) до дозволених.
2. Нова сесія підхопить налаштування. Перевірка: `npm run hub -- summary`.

Локально (Claude Code на вашому комп'ютері) можна замість цього задати `DATABASE_URL`
у `.env.local` — тоді CLI ходить у базу напряму.

## Розробка

```bash
cp .env.example .env.local   # і заповніть
npm install
npm run db:migrate
npm run dev                  # http://localhost:3000
```

Перед комітом: `npm run typecheck && npm run lint && npm run build`.
