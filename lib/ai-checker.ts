const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export type AICheckResult = {
  score: number;         // 0-100
  verdict: string;       // краткий вердикт
  mistakes: string[];    // список ошибок
  correctAnswer: string; // правильное решение (если ИИ может дать)
  explanation: string;   // объяснение
  raw: string;           // полный ответ ИИ
};

export async function aiCheckHomework(params: {
  taskTitle: string;
  taskDescription: string;
  correctAnswer?: string | null;
  studentAnswer: string;
  subjectName: string;
}): Promise<AICheckResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[ai-checker] DEEPSEEK_API_KEY не настроен');
    return null;
  }

  const systemPrompt = `Ты — опытный репетитор по математике и информатике. Проверь ответ ученика на задание.

Предмет: ${params.subjectName}
Задание: ${params.taskTitle}
Условие: ${params.taskDescription}
${params.correctAnswer ? `Правильный ответ от учителя: ${params.correctAnswer}` : ''}

Ответ ученика: ${params.studentAnswer}

Проверь ответ по трём критериям:
1. Правильный ли итоговый ответ?
2. Правильный ли ход решения?
3. Есть ли опечатки или вычислительные ошибки?

Отвечай СТРОГО в JSON-формате без markdown-обёртки:
{
  "score": <число 0-100>,
  "verdict": "<краткий вердикт 1 предложение>",
  "mistakes": ["<ошибка 1>", "<ошибка 2>"],
  "correctAnswer": "<правильный ответ, если можешь вычислить>",
  "explanation": "<подробное объяснение для ученика 2-4 предложения>"
}`;

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Ты репетитор. Отвечай только валидным JSON без markdown. Будь строгим, но справедливым.',
          },
          { role: 'user', content: systemPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[ai-checker] API error:', err);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Пытаемся распарсить JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Иногда ИИ добавляет ```json ... ``` — попробуем вырезать
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!parsed) {
      return {
        score: 0,
        verdict: 'Не удалось разобрать ответ ИИ',
        mistakes: [],
        correctAnswer: '',
        explanation: content.slice(0, 500),
        raw: content,
      };
    }

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      verdict: String(parsed.verdict || ''),
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      correctAnswer: String(parsed.correctAnswer || ''),
      explanation: String(parsed.explanation || ''),
      raw: content,
    };
  } catch (e: any) {
    console.error('[ai-checker] error:', e.message);
    return null;
  }
}