# Инструкция по деплою Task 08 на GitHub Pages

## ✅ Что уже сделано

1. ✅ `vite.config.js` - настроен правильный base: `/all_tasks_v23/task_08/`
2. ✅ `index.html` - убрана ссылка на несуществующий vite.svg
3. ✅ `dist/` - собрана production версия с правильными путями
4. ✅ `.github/workflows/deploy.yml` - создан workflow для автодеплоя
5. ✅ Локально всё работает на `http://localhost:4173/all_tasks_v23/task_08/`

## 🚀 Шаги для деплоя на GitHub Pages

### 1. Настрой GitHub Pages (только один раз)

1. Открой репозиторий на GitHub: https://github.com/alexsandro007/all_tasks_v23
2. Перейди в **Settings** → **Pages**
3. В разделе **Source** выбери: **GitHub Actions**
4. Сохрани

### 2. Закоммить и запушить изменения

```powershell
# Из корня репозитория
cd d:\all_tasks_v23

# Добавить все изменения
git add .

# Коммит
git commit -m "Fix task_08: remove vite.svg, update paths for GitHub Pages"

# Push в main
git push origin main
```

### 3. Дождаться завершения деплоя

1. Открой: https://github.com/alexsandro007/all_tasks_v23/actions
2. Дождись завершения workflow "Deploy to GitHub Pages" (обычно 1-2 минуты)
3. Статус должен стать зелёным ✅

### 4. Проверить работу

Открой: https://alexsandro007.github.io/all_tasks_v23/task_08/

**Что должно работать:**
- ✅ Приложение загружается
- ✅ Нет ошибок 404 в консоли (F12)
- ✅ Можно создавать плейлисты
- ✅ Данные сохраняются в localStorage
- ✅ Все стили применяются корректно

## 🐛 Если что-то не работает

### Ошибка 404 на ресурсы

Проверь `dist/index.html` - пути должны быть:
```html
<script src="/all_tasks_v23/task_08/assets/index-XXX.js"></script>
<link href="/all_tasks_v23/task_08/assets/index-XXX.css">
```

Если нет - проверь `vite.config.js`:
```javascript
base: '/all_tasks_v23/task_08/'  // Должно быть именно так
```

### Workflow не запускается

1. Проверь `.github/workflows/deploy.yml` существует
2. Проверь права: Settings → Actions → General → Workflow permissions: **Read and write**

### Белый экран

1. Открой консоль браузера (F12)
2. Посмотри ошибки
3. Обычно это 404 на JS/CSS файлы - проверь пути в dist/index.html

## 📁 Важные файлы

```
task_08/
├── .github/workflows/
│   ├── ci.yml          # Тесты (не трогать)
│   └── deploy.yml      # Деплой на Pages ✅
├── dist/               # Production build ✅
│   ├── index.html      # Пути: /all_tasks_v23/task_08/... ✅
│   └── assets/
├── index.html          # Без vite.svg ✅
└── vite.config.js      # base правильный ✅
```

## 🔗 Полезные ссылки

- **Репозиторий**: https://github.com/alexsandro007/all_tasks_v23
- **GitHub Actions**: https://github.com/alexsandro007/all_tasks_v23/actions
- **GitHub Pages**: https://alexsandro007.github.io/all_tasks_v23/task_08/
- **Главная страница**: https://alexsandro007.github.io/all_tasks_v23/

## ✅ Чеклист перед деплоем

- [x] `vite.config.js` → base: `/all_tasks_v23/task_08/`
- [x] `index.html` → убрана ссылка на vite.svg
- [x] `npm run build` → dist/ создан с правильными путями
- [x] Локально работает на http://localhost:4173/all_tasks_v23/task_08/
- [x] `.github/workflows/deploy.yml` существует
- [ ] GitHub Pages настроен (Source: GitHub Actions)
- [ ] Изменения закоммичены и запушены
- [ ] Workflow завершился успешно
- [ ] Приложение открывается на GitHub Pages

---

**После успешного деплоя не забудь:**
1. Обновить ссылку в главном `index.html` на GitHub Pages URL
2. Сделать скриншот для `task_08/doc/screenshots/preview.png`
