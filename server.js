const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database(process.env.DATABASE_PATH || './calls.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    manager TEXT NOT NULL,
    client_name TEXT NOT NULL,
    call_type TEXT NOT NULL,
    qualified TEXT NOT NULL,
    disqualify_reason TEXT,
    revenue TEXT,
    tariff TEXT,
    status TEXT NOT NULL,
    probability INTEGER DEFAULT 0,
    score_total REAL DEFAULT 0,
    score_script REAL DEFAULT 0,
    score_pain REAL DEFAULT 0,
    score_objections REAL DEFAULT 0,
    score_close REAL DEFAULT 0,
    objections_list TEXT,
    next_step TEXT,
    summary TEXT,
    doc_link TEXT,
    full_analysis TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Seed demo data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM calls').get();
if (count.c === 0) {
  const insert = db.prepare(`INSERT INTO calls 
    (date, manager, client_name, call_type, qualified, revenue, tariff, status, probability,
     score_total, score_script, score_pain, score_objections, score_close,
     objections_list, next_step, summary, full_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insert.run('2025-04-18','Kamila','Таштан Д.','Входящий','Да','$2.7M','Premium','pending',55,
    5,5,6,3,3,
    'Нужно посоветоваться',
    'Позвонить в понедельник утром с предложением забронировать место по цене раннего бронирования до 1 мая',
    'Камила нашла боль, но потеряла сделку на закрытии — не предложила забронировать место при действующей скидке до 1 мая.',
    JSON.stringify({
      qualification: {type:'Входящий', owner:'Да', revenue:'$2.7M', result:'Квалифицирован'},
      script: [
        {stage:'Открытие', icon:'⚠️', comment:'Представилась, спросила удобно ли говорить. Имя клиента в первом предложении не использовала.'},
        {stage:'Квалификация', icon:'⚠️', comment:'Оба вопроса задала. Вставила лишний вопрос про нишу бизнеса.'},
        {stage:'Выявление боли', icon:'⚠️', comment:'Нашла боль. Не задала: «Что мешает решить прямо сейчас?» и «Как давно с этим живёте?»'},
        {stage:'Презентация', icon:'⚠️', comment:'2+ мин на историю компании. Кейсы амбассадоров не использованы.'},
        {stage:'Тариф', icon:'❌', comment:'Сразу назвала все три тарифа. По скрипту: только Premium для $2.7M.'},
        {stage:'Закрытие', icon:'❌', comment:'Не предложила оплату (PayPal/Zelle). Легко согласилась ждать до понедельника.'}
      ],
      objections: [{
        title:'Возражение #1 — нужно посоветоваться / приду не один',
        quote:'«Можете мне на имейл это всё прислать, потому что я, скорее всего, не один приду»',
        type:'Нужно посоветоваться',
        how:'Напомнила про требования по обороту. Затем согласилась ждать.',
        script_match:'Не выполнено',
        result:'Возражение осталось',
        fix:'«Таштан, давайте прямо сейчас зафиксируем ваше место — скидка до 1 мая. Информацию для друзей пришлю отдельно.»'
      }],
      strong: [
        {text:'Зеркалирование боли', detail:'«То есть вы постоянно включены в операцию?» — клиент: «Да, 24 на 7». Влияние: высокое.'},
        {text:'Вопрос-согласие перед тарифами', detail:'Получила подтверждение клиента перед переходом к деньгам.'}
      ],
      weak: [
        {text:'История компании вместо боли', detail:'2+ мин на Украину и страны — потеряно время для углубления боли.'},
        {text:'Три тарифа сразу', detail:'Паралич выбора. Клиент не выбрал ни один.'},
        {text:'Слабое закрытие', detail:'Не использовала дедлайн скидки до 1 мая как инструмент закрытия.'}
      ],
      recommendations: [
        'Рассказывала историю компании 2 мин → Одно предложение об экспертизе, сразу к вопросам про бизнес → Больше времени на боль',
        'Презентовала все три тарифа → Только Premium для $2.7M, вниз — только при возражении по цене → Клиент выбирает один тариф',
        'Согласилась ждать до понедельника → Предложить предоплату для брони + дедлайн 1 мая → Часть клиентов закрывается сразу'
      ],
      prob_factors: [
        {sign:'+20%', text:'Входящий — сам оставил заявку'},
        {sign:'+15%', text:'Назвал конкретную боль и согласился с темой'},
        {sign:'+10%', text:'Спрашивал про детали формата'},
        {sign:'-15%', text:'Нужно посоветоваться — без конкретики'},
        {sign:'-10%', text:'Закрытие на предоплату не предложено'}
      ]
    })
  );

  insert.run('2025-04-15','Kamila','Михаил С.','Входящий','Да','$3.1M','Premium','closed',100,
    9,9,9,8,9,
    '',
    'Отправить анкету участника. Добавить в закрытый чат.',
    'Образцовый звонок. Менеджер чётко провёл по скрипту, закрыл на предоплату в рамках одного звонка.',
    JSON.stringify({
      qualification:{type:'Входящий',owner:'Да',revenue:'$3.1M',result:'Квалифицирован'},
      script:[
        {stage:'Открытие',icon:'✅',comment:'Всё по скрипту. Имя использовано сразу.'},
        {stage:'Квалификация',icon:'✅',comment:'Оба критерия без лишних вопросов.'},
        {stage:'Выявление боли',icon:'✅',comment:'Все ключевые вопросы заданы, боль углублена.'},
        {stage:'Презентация',icon:'✅',comment:'Тема борда связана с болью клиента. Кейсы амбассадоров использованы.'},
        {stage:'Тариф',icon:'✅',comment:'Только Premium. Переход вниз не потребовался.'},
        {stage:'Закрытие',icon:'✅',comment:'Предложила PayPal. Удержала на линии до оплаты.'}
      ],
      objections:[],
      strong:[
        {text:'Полное следование скрипту',detail:'Все этапы пройдены без отклонений.'},
        {text:'Закрытие на линии',detail:'Клиент оплатил не вешая трубку.'}
      ],
      weak:[],
      recommendations:['Использовать этот звонок как эталон для обучения команды.'],
      prob_factors:[
        {sign:'+20%',text:'Входящий'},
        {sign:'+15%',text:'Конкретная боль'},
        {sign:'+10%',text:'Детали и цена'},
        {sign:'+5%',text:'Оборот $3.1M'}
      ]
    })
  );

  insert.run('2025-04-14','Vitalina','Андрей К.','Исходящий','Нет','$0.7M','-','nq',0,
    7,8,0,0,0,
    '',
    'Добавить в CRM с тегом "до $1M — связаться через 6 мес".',
    'Клиент не прошёл квалификацию по обороту ($0.7M). Менеджер корректно завершил звонок.',
    JSON.stringify({
      qualification:{type:'Исходящий',owner:'Да',revenue:'$0.7M',result:'Не квалифицирован — оборот ниже $1M'},
      script:[
        {stage:'Открытие',icon:'✅',comment:'По скрипту для исходящего звонка.'},
        {stage:'Квалификация',icon:'✅',comment:'Оборот $0.7M — ниже порога. Зафиксировано в карточке.'},
        {stage:'Отказ',icon:'✅',comment:'Деликатно завершил. Предложил подписаться на соцсети.'},
        {stage:'Выявление боли',icon:'—',comment:'Не применимо.'},
        {stage:'Тариф',icon:'—',comment:'Не применимо.'},
        {stage:'Закрытие',icon:'—',comment:'Не применимо.'}
      ],
      objections:[],
      strong:[{text:'Корректный отказ',detail:'Клиент не чувствует себя отверженным. Дверь оставлена открытой.'}],
      weak:[],
      recommendations:['Добавить клиента в базу на будущее с пометкой о дате следующего контакта.'],
      prob_factors:[]
    })
  );

  insert.run('2025-04-10','Vitalina','Сергей П.','Исходящий','Да','$5.2M','Booster','closed',100,
    8,8,8,7,9,
    'Дорого',
    'Отправить анкету участника.',
    'Vitalina грамотно определила Booster для оборота $5.2M и закрыла сделку несмотря на возражение по цене.',
    JSON.stringify({
      qualification:{type:'Исходящий',owner:'Да',revenue:'$5.2M',result:'⚡ BOOSTER — оборот $5M+'},
      script:[
        {stage:'Открытие',icon:'✅',comment:'По скрипту для базы прошлых участников.'},
        {stage:'Квалификация',icon:'✅',comment:'Оборот $5.2M — пометка Booster сделана сразу.'},
        {stage:'Выявление боли',icon:'✅',comment:'Все вопросы заданы включая «Как давно с этим живёте?»'},
        {stage:'Презентация',icon:'✅',comment:'Презентовала встречу x100 с Высоцким — попала в запрос клиента.'},
        {stage:'Тариф',icon:'✅',comment:'Только Booster. Обоснование под оборот клиента.'},
        {stage:'Закрытие',icon:'✅',comment:'Закрыла через Zelle. Клиент оплатил на линии.'}
      ],
      objections:[{
        title:'Возражение #1 — дорого',
        quote:'«Ну, это немало за два дня...»',
        type:'Цена',
        how:'«Сколько стоит год в той же точке? Борд — это два дня которые меняют следующие несколько лет»',
        script_match:'Да',
        result:'Возражение снято',
        fix:'Отработано корректно по скрипту.'
      }],
      strong:[
        {text:'Правильный тариф сразу',detail:'Booster для $5.2M — без колебаний. Клиент почувствовал что его понимают.'},
        {text:'Отработка возражения по цене',detail:'Использовала фразу из скрипта дословно — сработало.'}
      ],
      weak:[],
      recommendations:['Использовать как эталон работы с сегментом $5M+.'],
      prob_factors:[
        {sign:'+20%',text:'Был на прошлых бордах'},
        {sign:'+15%',text:'Конкретная боль'},
        {sign:'+10%',text:'Оборот $5M+ — высокая платёжеспособность'},
        {sign:'+5%',text:'Позитивная реакция на продукт'}
      ]
    })
  );

  insert.run('2025-04-08','Kamila','Ольга Р.','Входящий','Да','$1.8M','Стандарт+','pending',35,
    4,4,5,3,2,
    'Подумаю; Посоветуюсь с мужем',
    'Перезвонить в пятницу. Уточнить принято ли решение.',
    'Слабое выявление боли и два нераскрытых возражения привели к тому что клиент ушёл думать без конкретного следующего шага.',
    JSON.stringify({
      qualification:{type:'Входящий',owner:'Да',revenue:'$1.8M',result:'Квалифицирован'},
      script:[
        {stage:'Открытие',icon:'✅',comment:'По скрипту.'},
        {stage:'Квалификация',icon:'✅',comment:'Оба критерия проверены.'},
        {stage:'Выявление боли',icon:'❌',comment:'Поверхностно. Клиент сказал «хочу развиваться» — менеджер не углубилась.'},
        {stage:'Презентация',icon:'⚠️',comment:'Назвала даты и место. Не связала тему борда с болью клиента.'},
        {stage:'Тариф',icon:'⚠️',comment:'Начала с Premium, перешла на Стандарт+ после вопроса про цену.'},
        {stage:'Закрытие',icon:'❌',comment:'Два возражения не отработаны. Не предложила предоплату.'}
      ],
      objections:[
        {
          title:'Возражение #1 — подумаю',
          quote:'«Мне нужно немного подумать»',
          type:'Сомнение в ценности',
          how:'«Конечно, возьмите время» — и перешла к следующей теме.',
          script_match:'Нет',
          result:'Возражение осталось',
          fix:'«Что именно поможет принять решение прямо сейчас?» — по скрипту.'
        },
        {
          title:'Возражение #2 — посоветуюсь с мужем',
          quote:'«Хочу обсудить с мужем, он у меня тоже в бизнесе»',
          type:'Нужно посоветоваться',
          how:'«Да, конечно, обсудите» — без предложения предоплаты.',
          script_match:'Нет',
          result:'Возражение осталось',
          fix:'Предложить предоплату для брони места по текущей цене.'
        }
      ],
      strong:[
        {text:'Правильный переход по тарифам',detail:'Начала с Premium, перешла вниз только при сомнении — логика соблюдена.'}
      ],
      weak:[
        {text:'Поверхностное выявление боли',detail:'«Хочу развиваться» — слишком общо. Не задала углубляющих вопросов.'},
        {text:'Два необработанных возражения',detail:'«Подумаю» и «посоветуюсь с мужем» — оба отпущены без отработки.'}
      ],
      recommendations:[
        'При «хочу развиваться» → спросить «что конкретно хотите изменить в следующие 6 месяцев?» → боль становится конкретной',
        'При «подумаю» → «Что именно поможет принять решение прямо сейчас?» — обязательный вопрос по скрипту',
        'При «посоветуюсь» → предложить предоплату для брони места по текущей цене'
      ],
      prob_factors:[
        {sign:'+20%',text:'Входящий'},
        {sign:'+5%',text:'Спрашивала про детали'},
        {sign:'-20%',text:'«Подумаю» без конкретных сроков'},
        {sign:'-15%',text:'Нужно посоветоваться без конкретики'},
        {sign:'-10%',text:'Возражения не отработаны'}
      ]
    })
  );
}

// API Routes
app.get('/api/calls', (req, res) => {
  const { period, manager, call_type } = req.query;
  let query = 'SELECT * FROM calls WHERE 1=1';
  const params = [];

  if (period === 'week') {
    // Wed-Tue week
    const now = new Date();
    const day = now.getDay();
    const diff = (day >= 3) ? day - 3 : day + 4;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0,0,0,0);
    query += ' AND date >= ?';
    params.push(weekStart.toISOString().split('T')[0]);
  } else if (period === 'month') {
    const monthStart = new Date();
    monthStart.setDate(1);
    query += ' AND date >= ?';
    params.push(monthStart.toISOString().split('T')[0]);
  }

  if (manager && manager !== 'all') {
    query += ' AND manager = ?';
    params.push(manager);
  }
  if (call_type && call_type !== 'all') {
    query += ' AND call_type = ?';
    params.push(call_type);
  }

  query += ' ORDER BY date DESC';
  const calls = db.prepare(query).all(...params);
  res.json(calls);
});

app.get('/api/calls/:id', (req, res) => {
  const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(req.params.id);
  if (!call) return res.status(404).json({ error: 'Not found' });
  if (call.full_analysis) {
    try { call.full_analysis = JSON.parse(call.full_analysis); } catch(e) {}
  }
  res.json(call);
});

app.post('/api/calls', (req, res) => {
  const d = req.body;
  const stmt = db.prepare(`INSERT INTO calls 
    (date, manager, client_name, call_type, qualified, disqualify_reason, revenue, tariff,
     status, probability, score_total, score_script, score_pain, score_objections, score_close,
     objections_list, next_step, summary, doc_link, full_analysis)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const result = stmt.run(
    d.date, d.manager, d.client_name, d.call_type, d.qualified,
    d.disqualify_reason||'', d.revenue||'', d.tariff||'',
    d.status, d.probability||0,
    d.score_total||0, d.score_script||0, d.score_pain||0, d.score_objections||0, d.score_close||0,
    d.objections_list||'', d.next_step||'', d.summary||'', d.doc_link||'',
    typeof d.full_analysis === 'object' ? JSON.stringify(d.full_analysis) : (d.full_analysis||'')
  );
  res.json({ id: result.lastInsertRowid, success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`BBBoard Dashboard running on port ${PORT}`));
