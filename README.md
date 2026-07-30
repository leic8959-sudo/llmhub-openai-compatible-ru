# LLMHub: OpenAI-compatible API starter for Codex, Cursor, Python and Node.js

Минимальный русскоязычный путь от регистрации до первого запроса к
OpenAI-совместимой API-точке LLMHub через `curl`, Python, Node.js и Codex.

Проект предназначен для разработчиков, которые хотят сохранить существующий
OpenAI-клиент и заменить только адрес API, ключ и ID модели. Серверная часть,
ключи и платёжная логика в этот репозиторий не входят.

English version: [README.en.md](README.en.md)

## Первый запрос за 60 секунд

[Создать аккаунт и получить $0.50 бесплатного API-кредита](https://llmhub.vip/sign-up?utm_source=github&utm_medium=partner&utm_campaign=integration-kit) · [актуальные цены](https://llmhub.vip/pricing) · [документация](https://llmhub.vip/docs)

После регистрации: создайте API key в [личном кабинете](https://llmhub.vip/keys),
получите доступную модель через `GET /v1/models` и запустите пример ниже. Замена
клиента не требуется: используется привычный OpenAI-совместимый формат.

Что вы проверите этим starter:

- доступность модели и авторизацию через `/v1/models`;
- обычный chat completion через PowerShell, Linux/macOS, Python или Node.js;
- фактический `usage` из ответа, чтобы контролировать стоимость запроса.

Ссылка выше помечена как GitHub-кампания, поэтому переходы и регистрации можно
сравнивать с другими каналами.

## Быстрый старт

1. [Создайте аккаунт](https://llmhub.vip/sign-up?utm_source=github&utm_medium=partner&utm_campaign=integration-kit), войдите в консоль и откройте [API Keys](https://llmhub.vip/keys).
2. Создайте API-ключ и получите доступную модель через `GET /v1/models`.
3. Скопируйте `.env.example` в `.env` и заполните значения только локально.
4. Выполните один из примеров ниже.

Для PowerShell:

```powershell
$env:LLMHUB_BASE_URL = "https://llmhub.vip/v1"
$env:LLMHUB_API_KEY = "<api-key>"
$env:LLMHUB_MODEL = "<model-id-from-dashboard>"
.\examples\request.ps1
```

Для Linux/macOS:

```bash
export LLMHUB_BASE_URL="https://llmhub.vip/v1"
export LLMHUB_API_KEY="<api-key>"
export LLMHUB_MODEL="<model-id-from-dashboard>"
bash examples/request.sh
```

## Python

Требуется Python 3.10 или новее. Пример использует только стандартную
библиотеку, поэтому дополнительная установка пакетов не нужна:

```bash
python examples/chat_completion.py
```

Пример проверяет HTTP-ответ, печатает текст ответа и `usage`, если поле
передано провайдером.

## Node.js

Требуется Node.js 18 или новее:

```bash
node examples/chat_completion.mjs
```

Используется встроенный `fetch`; зависимости устанавливать не требуется.

## Совместимый запрос

Все значения ниже должны соответствовать текущей документации и каталогу
моделей в личном кабинете:

Список доступных моделей можно получить до первого запроса:

```bash
curl https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

```http
POST /chat/completions
Authorization: Bearer <api-key>
Content-Type: application/json
```

```json
{
  "model": "<model-id-from-dashboard>",
  "messages": [
    {"role": "user", "content": "Проверьте соединение с API."}
  ],
  "temperature": 0.2
}
```

Совместимость с форматом OpenAI не означает, что у всех моделей одинаковый
набор параметров. Перед production-интеграцией отдельно проверьте streaming,
tool calls, JSON-ответы, лимит контекста, поля `usage` и поведение временных
ошибок.

## Контроль стоимости

Тарифы и доступность моделей меняются. Перед использованием сверяйте актуальные
цены на странице проекта и сохраняйте версию прайс-листа вместе с логом
запроса. Если входные и выходные токены тарифицируются раздельно, не заменяйте
их одной приблизительной суммой.

Для каждого запроса рекомендуется сохранять:

- внутренний `request_id`;
- модель и версию прайс-листа;
- `usage` из ответа;
- итоговый статус запроса;
- время ответа.

Не включайте в логи API-ключи, персональные данные и исходные документы
пользователей. Не повторяйте запрос бесконечно: повтор может привести к двум
списаниям и двум разным результатам генерации.

## Ссылки

- Документация: <https://llmhub.vip/docs>
- Каталог моделей: <https://llmhub.vip/models>
- Актуальные цены: <https://llmhub.vip/pricing>
- Проект: <https://llmhub.vip/>

## Раскрытие информации

LLMHub является оператором API-точки, использованной в примерах. Этот starter
не является официальным SDK OpenAI, Anthropic или Google и не утверждает наличие
партнёрства с этими компаниями.

## Лицензия

Код примеров распространяется по лицензии MIT. См. [LICENSE](LICENSE).
