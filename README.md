# 🚶 Прогулки вместе — сайт поиска людей для совместных прогулок

Дипломный проект. Пользователи создают объявления о прогулках, находят компанию рядом,
записываются на чужие прогулки, обсуждают детали в комментариях и подписываются на организаторов.

## Технологии

| Часть | Стек |
|---|---|
| Frontend | TypeScript, React 18, Vite, Zustand, Axios, React Router, Leaflet + OpenStreetMap, CSS3 |
| Backend | Python 3.10+, FastAPI, SQLAlchemy 2, Alembic, Pydantic 2, JWT (PyJWT), bcrypt, Uvicorn |
| БД и окружение | PostgreSQL 16, pgAdmin 4, Docker / Docker Desktop |

> 📱 **Мобильное приложение (PWA и Android APK)** — см. файл [MOBILE.md](MOBILE.md).

## Структура проекта

```
walk-together/
├── docker-compose.yml      # PostgreSQL + pgAdmin + backend + frontend
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/            # миграции БД (versions/0001_initial.py)
│   └── app/
│       ├── main.py         # точка входа FastAPI
│       ├── config.py       # настройки (из переменных окружения)
│       ├── database.py     # подключение к БД
│       ├── models.py       # таблицы: users, walks, participants, comments, subscriptions
│       ├── schemas.py      # Pydantic-схемы
│       ├── security.py     # хеш паролей, JWT
│       ├── deps.py         # текущий пользователь (гость / авторизованный)
│       └── routers/        # auth, users, walks, comments
└── frontend/
    ├── package.json, vite.config.ts, tsconfig.json, index.html
    └── src/
        ├── api.ts          # Axios
        ├── store/          # Zustand: authStore, walksStore
        ├── components/     # Navbar, WalkCard, Maps (Leaflet), ProtectedRoute
        └── pages/          # Home, Walk, WalkForm, MyWalks, Profile, User, Login, Register
```

---

## ВАРИАНТ 1. Запуск одной командой через Docker (рекомендуется)

### Что нужно установить
1. **Docker Desktop** — https://www.docker.com/products/docker-desktop/ (Windows / macOS / Linux).
   После установки запустите Docker Desktop и дождитесь, пока внизу слева появится зелёный статус «Engine running».
   На Windows при первом запуске может потребоваться включить WSL 2 — установщик сам подскажет.

### Шаги
1. Распакуйте ZIP-архив, например в `C:\projects\walk-together` (путь лучше без кириллицы и пробелов).
2. Откройте терминал в папке проекта:
   - Windows: откройте папку в Проводнике → в адресной строке напишите `cmd` → Enter
     (или PowerShell: ПКМ по папке → «Открыть в терминале»);
   - macOS / Linux: `cd путь/до/walk-together`.
3. Выполните:
   ```bash
   docker compose up --build
   ```
   Первый запуск займёт 3–7 минут (скачиваются образы, ставятся зависимости).
   Дождитесь строк вида:
   - `Application startup complete.` (backend),
   - `VITE ... ready` и `Local: http://localhost:5173/` (frontend).
4. Откройте в браузере:

| Что | Адрес |
|---|---|
| **Сайт** | http://localhost:5173 |
| **Swagger UI (документация API)** | http://localhost:8000/docs |
| **pgAdmin 4** | http://localhost:5050 (логин `admin@example.com`, пароль `admin`) |

5. Остановить: `Ctrl + C` в терминале, затем `docker compose down`.
   Запуск в фоне: `docker compose up -d`. Удалить ещё и данные БД: `docker compose down -v`.

Миграции Alembic применяются автоматически при старте backend-контейнера.

### Подключение pgAdmin к базе
1. Откройте http://localhost:5050 и войдите.
2. «Add New Server» → вкладка **General**: Name = `walks`.
3. Вкладка **Connection**: Host = `db`, Port = `5432`, Database = `walks`,
   Username = `walks`, Password = `walks` → Save.
4. Таблицы: Servers → walks → Databases → walks → Schemas → public → Tables.

---

## ВАРИАНТ 2. Запуск без Docker для приложений (БД — в Docker)

Подходит для разработки и отладки. Нужно установить: **Python 3.10+**, **Node.js 18+ (лучше 20)**, **Docker Desktop**.
Проверка версий: `python --version`, `node --version`, `npm --version`.

### Шаг 1. База данных
В корне проекта:
```bash
docker compose up -d db pgadmin
```

### Шаг 2. Backend
```bash
cd backend

# создать виртуальное окружение
python -m venv .venv

# активировать:
#   Windows (cmd):        .venv\Scripts\activate
#   Windows (PowerShell): .venv\Scripts\Activate.ps1
#   macOS / Linux:        source .venv/bin/activate

pip install -r requirements.txt

# применить миграции (создаст таблицы)
alembic upgrade head

# запустить сервер
uvicorn app.main:app --reload --port 8000
```
По умолчанию backend подключается к `postgresql+psycopg2://walks:walks@localhost:5432/walks`.
Другие настройки задаются переменными окружения (см. `backend/.env.example`).
Backend: http://localhost:8000, документация: http://localhost:8000/docs.

> Windows PowerShell: если активация окружения запрещена, выполните один раз
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Шаг 3. Frontend (в новом окне терминала)
```bash
cd frontend
npm install
npm run dev
```
Сайт: http://localhost:5173 (запросы `/api` автоматически проксируются на backend :8000).

Сборка для production: `npm run build` (результат в `frontend/dist`).

---

## Как проверить работу сайта

1. Откройте http://localhost:5173 — каталог (пока пустой). Гость может смотреть каталог, карту, карточки и комментарии.
2. «Регистрация» → создайте аккаунт (логин, email, пароль).
3. «Создать» → заполните форму, нажмите «Найти на карте» (или кликните по карте) → «Опубликовать».
4. Зарегистрируйте второй аккаунт (другой браузер или режим инкогнито) → откройте прогулку → «Записаться», напишите комментарий,
   откройте профиль организатора → «Подписаться».
5. «Мои прогулки» — вкладки: «Я организую», «Я иду», «Подписки».

Те же действия можно выполнять через Swagger UI: `POST /api/auth/register` → скопируйте `access_token` →
кнопка **Authorize** → вставьте токен.

## Основные эндпоинты API

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| POST | `/api/auth/register` | регистрация, возвращает JWT | все |
| POST | `/api/auth/login` | вход (email или логин + пароль) | все |
| GET | `/api/auth/me` | текущий пользователь | авторизованный |
| GET | `/api/walks` | каталог (фильтры: `q`, `city`, `category`, `date_from`, `date_to`, `organizer_id`) | все |
| GET | `/api/walks/{id}` | карточка прогулки | все |
| POST | `/api/walks` | создать прогулку | авторизованный |
| PUT / DELETE | `/api/walks/{id}` | изменить / удалить свою прогулку | организатор |
| POST / DELETE | `/api/walks/{id}/join` | записаться / отменить запись | авторизованный |
| GET | `/api/walks/{id}/participants` | список участников | все |
| GET | `/api/walks/my/organized`, `/api/walks/my/joined` | мои прогулки | авторизованный |
| GET / POST | `/api/walks/{id}/comments` | комментарии | чтение — все, запись — авторизованный |
| DELETE | `/api/comments/{id}` | удалить свой комментарий | автор |
| GET | `/api/users/{id}` | публичный профиль организатора | все |
| PUT | `/api/users/me` | изменить свой профиль | авторизованный |
| POST / DELETE | `/api/users/{id}/subscribe` | подписаться / отписаться | авторизованный |
| GET | `/api/users/me/subscriptions` | мои подписки | авторизованный |

## Типичные проблемы

| Проблема | Решение |
|---|---|
| `Cannot connect to the Docker daemon` | Запустите Docker Desktop и дождитесь статуса «Engine running». |
| `port is already allocated` (5432, 8000, 5173, 5050) | Порт занят. Закройте программу, использующую порт, или поменяйте левую часть в `ports:` в `docker-compose.yml` (например `"5433:5432"`). |
| В браузере «Нет связи с сервером» | Проверьте http://localhost:8000/api/health — должно вернуть `{"status":"ok"}`. Смотрите логи: `docker compose logs backend`. |
| Backend не стартует из-за БД | Подождите несколько секунд — БД поднимается; или `docker compose restart backend`. |
| Карта серая / без плиток | Нужен интернет (плитки OpenStreetMap и поиск адреса Nominatim загружаются из сети). |
| `alembic: command not found` | Не активировано виртуальное окружение (`.venv`). |
| `npm install` падает | Обновите Node.js до 18+ (`node --version`). |
| Сбросить БД полностью | `docker compose down -v`, затем снова `docker compose up --build`. |

## Безопасность

- Пароли хранятся только в виде bcrypt-хеша, вход — по JWT (`Authorization: Bearer <token>`, срок жизни 24 часа).
- Перед публикацией проекта замените `SECRET_KEY` и пароли БД/pgAdmin (файл `.env`).
