import fs from 'fs';
import path from 'path';

const ARGS = process.argv.slice(2);
const file = ARGS[0];

if (!file) {
  console.error('❌ Укажи имя файла: npx tsx scripts/clean-notes.ts math-6.md');
  process.exit(1);
}

const filePath = path.join(process.cwd(), 'content', file);

if (!fs.existsSync(filePath)) {
  console.error(`❌ Файл не найден: ${filePath}`);
  process.exit(1);
}

let text = fs.readFileSync(filePath, 'utf-8');
const before = text.length;

// 1. Убираем все маркеры вида 📖 [ИСТОЧНИК: ...] — и на отдельной строке, и внутри строки
text = text.replace(/📖\s*\[ИСТОЧНИК:[^\]]*\]\s*/g, '');

// 2. Убираем оставшиеся пустые маркеры 📖, если где-то есть
text = text.replace(/📖\s*$/gm, '');

// 3. Убираем осиротевшие строки с одним "Мakarychev" или просто "стр. N, № N" без маркера (на случай если что-то осталось)
text = text.replace(/\n\s*\[ИСТОЧНИК:[^\]]*\][^\n]*/g, '');

// 4. Чистим тройные и более пустые строки — превращаем в двойные
text = text.replace(/\n{3,}/g, '\n\n');

// 5. Убираем пробелы в конце строк
text = text.replace(/[ \t]+$/gm, '');

// 6. Убираем пробелы перед первым символом каждой строки (не относящиеся к markdown-спискам)
// — опционально, но осторожно: не трогаем строки, начинающиеся с -, *, цифры, |
text = text
  .split('\n')
  .map((line) => {
    if (/^\s+/.test(line) && !/^\s*([-*]|\d+\.|\||>|#{1,6})/.test(line)) {
      return line.replace(/^\s+/, '');
    }
    return line;
  })
  .join('\n');

// 7. В самом конце — если файл заканчивается лишними пустыми строками, убираем
text = text.replace(/\n+$/, '\n');

fs.writeFileSync(filePath, text, 'utf-8');

const after = text.length;
console.log(`✅ Обработан: content/${file}`);
console.log(`   Было: ${before} символов`);
console.log(`   Стало: ${after} символов`);
console.log(`   Убрано: ${before - after} символов (${Math.round((1 - after / before) * 100)}%)`);