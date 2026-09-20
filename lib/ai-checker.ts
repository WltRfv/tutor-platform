const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export type AICheckResult = {
  score: number;
  verdict: string;
  mistakes: string[];
  correctAnswer: string;
  explanation: string;
  raw: string;
};

export type AICheckParams = {
  taskTitle: string;
  taskDescription: string;
  correctAnswer?: string | null;
  studentAnswer: string;
  subjectName: string;
  codeBlocks?: { language: string; task: string; code: string }[];
};

export async function aiCheckHomework(
  params: AICheckParams
): Promise<AICheckResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[ai-checker] DEEPSEEK_API_KEY не настроен');
    return null;
  }

  let codeSection = '';
  if (params.codeBlocks && params.codeBlocks.length > 0) {
    codeSection =
      '\n\n=== ЗАДАЧИ ПО ПРОГРАММИРОВАНИЮ ===\n' +
      params.codeBlocks
        .map(
          (b, i) =>
            `\nЗадача ${i + 1} (${b.language}):\n${b.task}\n\nКод ученика:\n\`\`\`${b.language}\n${b.code}\n\`\`\``
        )
        .join('\n');
  }

  const systemPrompt = `Ты — опытный репетитор по математике и информатике. Проверь работу ученика.

Предмет: ${params.subjectName}
Задание: ${params.taskTitle}
Условие: ${params.taskDescription}
${params.correctAnswer ? `Правильные ответы от учителя: ${params.correctAnswer}` : ''}

=== ОТВЕТЫ УЧЕНИКА (текстовые) ===
${params.studentAnswer || '(нет текстовых ответов)'}
${codeSection}

Оцени:
1. Правильность итоговых ответов.
2. Правильность хода решения.
3. Для кода: работает ли, есть ли ошибки логики/синтаксиса, можно ли улучшить.

Отвечай СТРОГО валидным JSON без markdown:
{
  "score": <0-100>,
  "verdict": "<краткий вердикт 1 предложение>",
  "mistakes": ["<ошибка 1>", "<ошибка 2>"],
  "correctAnswer": "<правильный ответ / эталонное решение, если можешь>",
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

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
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