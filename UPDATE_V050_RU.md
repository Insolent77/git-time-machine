# Обновление Git Time Machine до логики 0.5

Эта версия исправляет неверную реконструкцию истории из архивов разного охвата.

## Установка

1. Распакуйте патч в корень проекта с заменой файлов.
2. Выполните:

```powershell
npm run test:core
npm run build
```

3. После успешной сборки:

```powershell
git add src/App.tsx src/i18n.ts src/styles.css src/lib/types.ts src/lib/analyzer.ts src/lib/zip.ts scripts/core-smoke.mjs README.md CHANGELOG.md UPDATE_V050_RU.md
git commit -m "fix: make archive history reconstruction scope-aware"
git pull --rebase origin main
git push origin main
```

## Что проверить

При сравнении `сайт.zip` и `alex-educator-lk-mvp.zip` автоматический режим должен показать:

- режим: `Отдельный модуль / патч`;
- добавлено: 18 файлов;
- удалено: 0 файлов;
- совпадающих путей: 0;
- один реконструированный набор изменений;
- предупреждение, что отсутствующие файлы старого архива не считаются удалёнными.
