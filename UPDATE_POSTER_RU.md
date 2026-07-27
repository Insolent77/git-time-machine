# Обновление интерфейса Git Time Machine

В обновлении 0.3.0 добавлены:

- экспериментальный интерфейс по референсу технического плаката;
- светлая бумажная сетка, соединительные линии и центральная схема архивов;
- English по умолчанию;
- переключение EN / RU / 中文 / DE / ES;
- локализация интерфейса, дат, предполагаемых коммитов и экспортируемого CHANGELOG;
- адаптация для телефона, планшета и компьютера.

## Установка патча

Распакуйте `git-time-machine-poster-patch.zip` в корень локального проекта с заменой файлов.

Затем выполните:

```powershell
npm install
npm run test:core
npm run build

git add src/App.tsx src/i18n.ts src/styles.css index.html package.json README.md CHANGELOG.md
git commit -m "feat: add archive poster interface and five languages"
git pull --rebase origin main
git push origin main
```

После успешного push GitHub Actions автоматически соберёт и опубликует сайт.

Проверка:

```text
https://insolent77.github.io/git-time-machine/
```

При отображении старой версии обновите страницу через `Ctrl + F5`.
