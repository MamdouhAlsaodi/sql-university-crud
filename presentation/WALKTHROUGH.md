# شرح عرض تقديمي — SQL University CRUD

> دليل المتحدث (Speaker Notes) لـ 15 slide من `presentation/SLIDES.md`.
> كل slide فيه: ماذا تقول، كم ثانية تقضي، وأي قسم في الوثائق يرتبط به.

## Slide 1: Apresentação — Sistema Universitário (SQL CRUD)

**⏱️ المدة المقترحة:** 30 ثانية

**🎙️ ماذا تقول:**
> "السلام عليكم. اليوم سأعرض عليكم مشروعي لـ Banco de Dados I. اسمه 'Sistema Universitário' — وهو تطبيق CRUD كامل مع SQL puro وتطبيق ويب Express. في 5 دقائق سأريكم schema و 8 تقارير SQL و 10 features فوق المطلوب."

**🔗 مرجع:** [PDR § الرؤية](../PDR.md#الرؤية-vision)

---

## Slide 2: Objetivo

**⏱️ المدة المقترحة:** 60 ثانية

**🎙️ ماذا تقول:**
> "المطلوب من الـ professor كان بسيطًا: 4 جداول مترابطة + سكربتات SQL. لكن أنا بنيت تطبيق ويب كامل فوق الـ DB. الـ stack: Node.js + Express + MySQL/MariaDB. الـ connection بـ mysql2 driver — وهو مكافئ لـ ODBC على Node.js. الـ professor سألني عن ODBC، فأضفت string الـ ODBC في الـ README لأُظهر أن هذا driver يستخدم نفس البروتوكول."

**🔗 مرجع:** [PLAN § الهدف العام](../PLAN.md#الهدف-العام)

---

## Slide 3: Domínio escolhido

**⏱️ المدة المقترحة:** 45 ثانية

**🎙️ ماذا تقول:**
> "اخترت domínio جامعة لأن لها 4 كيانات واضحة: Curso، Disciplina، Aluno، Matricula. هذا يكفي لتوضيح العلاقات 1:N و N:N (عبر Matricula). 42 rows تعطينا داتا كافية لتجرّب 8 تقارير SQL حقيقية."

---

## Slide 4: Modelagem — Diagrama ER

**⏱️ المدة المقترحة:** 90 ثانية

**🎙️ ماذا تقول:**
> "هنا الـ ER diagram. لاحظ:
> - Disciplina.curso_id → Curso مع ON DELETE CASCADE — لأن disciplina لا توجد بدون curso
> - Aluno.curso_id → Curso مع ON DELETE SET NULL — لأن aluno قد ينقل لـ curso آخر
> - Matricula.aluno_id → Aluno مع CASCADE
> - Matricula.disciplina_id → Disciplina مع CASCADE
> - UNIQUE(aluno_id, disciplina_id) — منع التسجيل المكرر"

**🔗 مرجع:** `/schema` في التطبيق يعرض نفس الـ diagram بشكل تفاعلي.

---

## Slide 5: Constraints aplicadas (resumo)

**⏱️ المدة المقترحة:** 75 ثانية

**🎙️ ماذا تقول:**
> "10 constraints: 4 PKs، 5 FKs، 2 UNIQUE، 3 CHECKs. الـ CHECK nota BETWEEN 0 AND 10 يمنع الأستاذ من إدخال درجة 15. الـ UNIQUE composta يمنع تسجيل نفس الطالب في نفس المادة مرتين. الـ CASCADE يضمن أن حذف Curso يحذف Disciplinas تلقائيًا."

**🔗 مرجع:** `sql/01_create_schema.sql`

---

## Slide 6: Camadas da aplicação

**⏱️ المدة المقترحة:** 60 ثانية

**🎙️ ماذا تقول:**
> "3 طبقات: المتصفح (HTML/CSS/JS puros)، خادم Express على Node.js، قاعدة بيانات MariaDB. لا ORM. لا build step. هذا قرار معماري واعي — نريد إظهار SQL puro للـ professor، مش SQL مدفون تحت Prisma."

---

## Slide 7: Telas (6)

**⏱️ المدة المقترحة:** 45 ثانية

**🎙️ ماذا تقول:**
> "6 شاشات: Dashboard مع KPIs، CRUD للـ 4 جداول، و /schema يعرض ER diagram. الأهم: /reports يعرض 8 استعلامات SQL مع الـ SQL نفسه ظاهر — الطالب يمكنه قراءة كل استعلام قبل ما ينفّذ."

---

## Slide 8: Conexão ODBC / mysql2

**⏱️ المدة المقترحة:** 60 ثانية

**🎙️ ماذا تقول:**
> "سؤال شائع: 'لماذا لا تستخدم ODBC؟' الجواب: في Node.js الـ driver 'mysql2' يستخدم libmysqlclient الأصلي — نفس البروتوكول الذي يستخدمه ODBC. الفرق: mysql2 أبسط ولا يحتاج unixODBC setup. لكن أضفت الـ ODBC connection string في الـ README لإثبات التكافؤ."

---

## Slide 9: Demonstração ao vivo (roteiro 5 min)

**⏱️ المدة المقترحة:** 90 ثانية

**🎙️ ماذا تقول:**
> "في الـ demo الحي سأريكم:
> 1. تشغيل schema + seed
> 2. التطبيق يفتح
> 3. الـ Dashboard مع KPIs
> 4. /schema يعرض الـ ER diagram
> 5. /reports يعرض تقارير
> 6. محاولة قيد مكرر → يرفض UNIQUE
> 7. محاولة إدخال nota=15 → يرفض CHECK
> 
> 5 دقائق كافية."

---

## Slide 10: Relatórios implementados (script 03)

**⏱️ المدة المقترحة:** 75 ثانية

**🎙️ ماذا تقول:**
> "8 تقارير SQL: R1 يستخدم LEFT JOIN لإظهار الطلاب بدون curso. R2 GROUP BY لحساب عدد الطلاب. R3 مع CASE WHEN لعرض breakdown حسب status. R4 HAVING لترتيب الطلاب المتفوقين. R5 WHERE بسيط للـ reprovados. R6 SUM للساعات. R7 LEFT JOIN ... WHERE NULL للـ disciplinas بدون تسجيل. R8 GROUP BY للـ counts حسب status."

**🔗 مرجع:** `/reports` في التطبيق

---

## Slide 11: Decisões de modelagem — por que cada escolha?

**⏱️ المدة المقترحة:** 90 ثانية

**🎙️ ماذا تقول:**
> "6 قرارات أساسية:
> 1. INT AUTO_INCREMENT بدل SERIAL — معيار MySQL
> 2. ENGINE=InnoDB — للـ FK enforcement
> 3. utf8mb4 — Unicode كامل
> 4. CHECK nota — defense in depth
> 5. UNIQUE composta — قاعدة عمل
> 6. ENUM للـ status — 4 قيم فقط
> 
> لكل قرار، سطر واحد في الـ schema يوضح السبب."

---

## Slide 12: Possíveis extensões (próximos passos)

**⏱️ المدة المقترحة:** 30 ثانية

**🎙️ ماذا تقول:**
> "إذا كان عندي وقت أكثر، كنت سأضيف: WebSocket للـ real-time، JWT auth، Docker Compose، Jest tests. لكن المطلوب الأساسي كان CRUD مع SQL — وهذا مكتمل."

---

## Slide 13: Como rodar

**⏱️ المدة المقترحة:** 45 ثانية

**🎙️ ماذا تقول:**
> "التشغيل بسيط: clone، npm install، cp .env.example .env، npm run db:create، npm run db:seed، npm start. يفتح على :4000. الخطوات موثقة في الـ README."

---

## Slide 14: Conclusão

**⏱️ المدة المقترحة:** 60 ثانية

**🎙️ ماذا تقول:**
> "ما تعلمته من هذا المشروع:
> 1. Integrity يبدأ في الـ schema، مش في الـ app
> 2. UNIQUE/CHECK/FK تحمي حتى لو bug في الـ code
> 3. ER diagram يجبرني على التفكير في العلاقات قبل الـ code
> 4. التقارير SQL أعمق من ORM — تجبرني على فهم البيانات
> 
> شكرًا لوقتكم. هل هناك أسئلة؟"

**🔗 مرجع:** [PDR § معايير النجاح](../PDR.md#-معايير-نجاح)

---

## Slide 15: Slide 15

**⏱️ المدة المقترحة:** 15 ثانية

**🎙️ ماذا تقول:**
> "Slide فارغ — مفيد لإضافة سلايد Q&A أو شكر إضافي."

---

## 📊 ملخص الإجمالي

| البند | القيمة |
|---|---|
| عدد الـ slides | 15 |
| إجمالي المدة | ~14 دقيقة |
| المدة الموصى بها فعليًا | 5–7 دقائق (تخطي بعض الشرح) |
| الجمهور المستهدف | Professor + زملاء الدفع |
| اللغة | برتغالية (pt-BR) في الشرائح، عربي في الـ speaker notes |

## 🎤 نصائح للتقديم

1. **افتح بـ 30 ثانية** قوية: عرّف نفسك + المشروع في جملة واحدة
2. **لا تقرأ من الشرائح** — استخدمها كـ cue cards
3. **أرِ لا تشرح**: الـ live demo أقوى من الكلام
4. **استعد للأسئلة**:
   - "لماذا MySQL وليس Postgres؟" → سهل التثبيت
   - "لماذا raw SQL وليس ORM؟" → المطلوب الأكاديمي
   - "لماذا Express وليس NestJS؟" → أبسط وأخف
   - "كم استغرق؟" → ~3 ساعات عبر جلستين
5. **اختم بسؤال** مش بـ "شكرًا" — افتح نقاش