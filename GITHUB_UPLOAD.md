# Инструкция по загрузке на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на https://github.com
2. Нажмите кнопку **"New"** (или **"+"** → **"New repository"**)
3. Заполните форму:
   - **Repository name**: `mobdev-lab3` (или любое другое имя)
   - **Description**: "Лабораторная работа №3: Управление ресурсами и использование хуков"
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть в проекте)
4. Нажмите **"Create repository"**

## Шаг 2: Подключите локальный репозиторий к GitHub

После создания репозитория GitHub покажет инструкции. Выполните команды:

```bash
cd "/home/daniel/Documents/MobDev/2 лаба/lab3"

# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mobdev-lab3.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/mobdev-lab3.git

# Отправьте код на GitHub
git push -u origin main
```

## Шаг 3: Обновите ссылку в REPORT.md

После загрузки на GitHub:

1. Откройте `REPORT.md`
2. Найдите раздел "8. Ссылка на репозиторий GitHub"
3. Замените `<URL_ВАШЕГО_РЕПОЗИТОРИЯ>` на реальную ссылку, например:
   ```
   https://github.com/YOUR_USERNAME/mobdev-lab3
   ```

## Альтернатива: Использование GitHub CLI

Если у вас установлен GitHub CLI (`gh`):

```bash
# Авторизуйтесь (если еще не авторизованы)
gh auth login

# Создайте репозиторий и загрузите код
cd "/home/daniel/Documents/MobDev/2 лаба/lab3"
gh repo create mobdev-lab3 --public --source=. --remote=origin --push
```

## Проверка

После загрузки проверьте:
- Репозиторий доступен по ссылке
- Все файлы загружены (кроме node_modules и других игнорируемых)
- README.md отображается на главной странице репозитория

