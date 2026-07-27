# Публикация на GitHub

## 1. Создайте репозиторий

На GitHub создайте пустой публичный репозиторий с названием:

```text
git-time-machine
```

Не добавляйте через интерфейс README, `.gitignore` или лицензию — они уже находятся в проекте.

## 2. Установите зависимости и проверьте проект

Откройте терминал в папке проекта:

```powershell
npm install
npm run test:core
npm run build
npm run dev
```

После `npm install` появится `package-lock.json`. Его нужно добавить в Git.

## 3. Отправьте проект на GitHub

Замените `YOUR_USERNAME` на свой логин GitHub:

```powershell
git init
git add .
git commit -m "feat: launch Git Time Machine MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/git-time-machine.git
git push -u origin main
```

## 4. Включите GitHub Pages

В репозитории откройте:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

После этого откройте вкладку `Actions`. Workflow `Deploy Git Time Machine to GitHub Pages` соберёт и опубликует приложение.

Адрес сайта:

```text
https://YOUR_USERNAME.github.io/git-time-machine/
```

## 5. Рекомендуемое описание репозитория

```text
Reconstruct a plausible Git history from old ZIP snapshots — privately, directly in the browser.
```

Темы репозитория:

```text
git history-reconstruction zip diff typescript react vite developer-tools portfolio-project
```
