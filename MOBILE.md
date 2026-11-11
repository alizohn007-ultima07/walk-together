# 📱 Мобильное приложение «Прогулки вместе»

Приложение сделано из того же сайта (React) и работает с тем же backend. Есть два способа:

| Способ | Что получится | Сложность |
|---|---|---|
| **A. PWA** | Сайт устанавливается на экран телефона как приложение (иконка, полноэкранный режим) | лёгкий |
| **B. Android-приложение (APK)** через Capacitor | Настоящее приложение для Android | средний |

На телефоне интерфейс автоматически переключается на мобильный вид: внизу появляется панель вкладок
(Прогулки · Создать · Мои · Профиль).

---

## Способ A. PWA (установка с сайта)

Важно: браузер разрешает установку приложения только при **HTTPS** (или на `localhost`).
Поэтому сайт сначала нужно выложить в интернет или временно открыть через туннель.

**Быстрый вариант для демонстрации (туннель):**
1. Запустите проект: `docker compose up --build`.
2. Установите https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ (cloudflared) и выполните:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
   В консоли появится адрес вида `https://что-то.trycloudflare.com`.
3. Откройте этот адрес на телефоне:
   - **Android (Chrome):** меню ⋮ → «Установить приложение» / «Добавить на главный экран».
   - **iPhone (Safari):** кнопка «Поделиться» → «На экран Домой».

Для постоянной работы разместите проект на хостинге/VPS с доменом и HTTPS.

---

## Способ B. Android-приложение (APK)

### Что нужно установить
1. **Node.js 18+ (лучше 20)** — https://nodejs.org
2. **Android Studio** — https://developer.android.com/studio (при установке оставьте галочки Android SDK и Android Virtual Device).
3. **JDK 17** обычно уже входит в Android Studio.
4. Запущенный backend (`docker compose up -d db backend` в корне проекта).

### Шаг 1. Укажите адрес сервера
Откройте файл `frontend/.env.mobile` и поставьте адрес backend:

| Где запускаете приложение | Что написать |
|---|---|
| Эмулятор Android Studio | `VITE_API_URL=http://10.0.2.2:8000` (по умолчанию) |
| Реальный телефон в одной Wi-Fi сети с компьютером | `VITE_API_URL=http://192.168.1.5:8000` — вместо `192.168.1.5` IP вашего компьютера (Windows: `ipconfig`, macOS/Linux: `ifconfig`) |
| Сервер в интернете | `VITE_API_URL=https://ваш-домен.ру` |

Для реального телефона в Windows разрешите порт 8000 в брандмауэре (при первом запросе нажмите «Разрешить доступ»).

### Шаг 2. Установите зависимости и добавьте Android-проект
```bash
cd frontend
npm install
npm run build:mobile
npx cap add android
```
(`npx cap add android` выполняется один раз — создаётся папка `android/`.)

### Шаг 3. Откройте проект в Android Studio и запустите
```bash
npm run android
```
Команда соберёт сайт, синхронизирует его с Android-проектом и откроет Android Studio.
Дождитесь, пока закончится «Gradle sync» (внизу справа), затем:
- выберите устройство (эмулятор или подключённый по USB телефон с включённой «Отладкой по USB»);
- нажмите зелёную кнопку **Run ▶**.

### Шаг 4. Получить файл APK
В Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
Готовый файл будет в `frontend/android/app/build/outputs/apk/debug/app-debug.apk` — его можно отправить на телефон и установить.

### После изменений в коде сайта
```bash
cd frontend
npm run cap:sync
```
и снова нажмите Run в Android Studio.

---

## Частые проблемы

| Проблема | Решение |
|---|---|
| В приложении «Нет связи с сервером» | Проверьте `VITE_API_URL` в `.env.mobile`, что backend запущен, и откройте `http://АДРЕС:8000/api/health` в браузере телефона. После изменения `.env.mobile` выполните `npm run cap:sync`. |
| Эмулятор не видит `localhost` | В эмуляторе компьютер доступен как `10.0.2.2`, а не `localhost`. |
| `npx cap add android` — ошибка | Сначала выполните `npm install` и `npm run build:mobile` (должна появиться папка `dist`). |
| Gradle ругается на JDK | В Android Studio: Settings → Build Tools → Gradle → Gradle JDK = 17 (jbr-17). |
| Кнопка «Установить приложение» не появляется (PWA) | Нужен HTTPS-адрес (туннель или хостинг), а не `http://IP`. |
| iPhone (App Store) | Для iOS нужен Mac с Xcode и аккаунт Apple Developer; для демо достаточно PWA через Safari. |
