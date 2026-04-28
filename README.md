# Car Detailes Saler (OPE-71)

Платформа для продажу автозапчастин з AI-пошуком та адмін-панеллю.

## 🚀 Технології

- **Framework:** Next.js (App Router)
- **Мова:** TypeScript
- **Стилізація:** Tailwind CSS
- **UI Kit:** Zhuk Design System
- **База даних:** Supabase (PostgreSQL)
- **AI:** Ollama (чат-пошук запчастин)
- **Форми:** react-hook-form
- **Іконки:** lucide-react

## 📋 Функціонал

- **AI-чат** для пошуку запчастин по опису
- **Адмін-панель** з CRUD для:
  - Запчастин (parts)
  - Категорій (categories)
  - Замовлень (orders)
  - Автомобілів (cars)
- **Пошук по VIN** — декодування марки/моделі
- **Аналоги** — пошук аналогів по коду деталі
- **Авторизація** через Supabase Auth

## 🗄️ Структура БД

| Таблиця | Опис |
|---------|------|
| `cars` | Автомобілі (VIN, brand, model, year, engine) |
| `categories` | Категорії (ієрархічні, parent_id) |
| `parts` | Запчастини (code, name, price, stock) |
| `analogs` | Аналоги запчастин |
| `orders` | Замовлення |
| `order_items` | Позиції замовлень |

## 🧑‍💻 Запуск

```bash
# Встановити залежності
npm install

# Налаштувати .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Запустити SQL міграцію
# supabase.sql → SQL Editor в Supabase Dashboard

# Запустити дев-сервер
npm run dev
```

## 📁 Структура проекту

```
app/
  page.tsx          # AI-чат (головна)
  admin/page.tsx    # Адмін-панель
  layout.tsx        # Root layout
components/
  chat/
    ChatInterface.tsx  # Чат-компонент
lib/
  types.ts          # Типи (Part, Category, Order...)
  supabaseClient.ts # Supabase клієнт
auth/               # Supabase Auth (готовий, налаштований)
```

## 🔗 Посилання

- **GitHub:** https://github.com/Mykhailo-Zhuk/car-detailes-saler
- **Supabase:** https://supabase.com/dashboard/project/wznofwrctkemcmwyndmg
- **Linear:** OPE-71
