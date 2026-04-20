# BBBoard #19 — Dashboard

## Запуск локально
```
npm install
npm start
```
Открыть: http://localhost:3000

## Деплой на Railway
1. Загрузить папку на GitHub
2. В Railway: New Project → Deploy from GitHub → выбрать репозиторий
3. Railway автоматически запустит сервер

## Make Webhook — как отправлять данные

После анализа звонка Make делает HTTP POST запрос:

**URL:** `https://ВАШ_ДОМЕН.railway.app/api/calls`
**Method:** POST
**Headers:** Content-Type: application/json

**Body (JSON):**
```json
{
  "date": "2025-04-20",
  "manager": "Kamila",
  "client_name": "Имя Клиента",
  "call_type": "Входящий",
  "qualified": "Да",
  "disqualify_reason": "",
  "revenue": "$2.7M",
  "tariff": "Premium",
  "status": "pending",
  "probability": 55,
  "score_total": 5,
  "score_script": 5,
  "score_pain": 6,
  "score_objections": 3,
  "score_close": 3,
  "objections_list": "Нужно посоветоваться",
  "next_step": "Перезвонить в понедельник",
  "summary": "Краткое резюме для руководителя",
  "doc_link": "https://docs.google.com/...",
  "full_analysis": { ...полный JSON анализа... }
}
```

Поле `status`: `closed` / `pending` / `lost` / `nq`
