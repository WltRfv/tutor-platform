// Реестр категорий предметов (для формы регистрации и управления)
export const SUBJECT_CATEGORIES = [
  {
    id: 'math',
    label: 'Математика',
    description: '5–6 класс',
    grades: [5, 6],
    color: 'purple',
    codes: { 5: 'MATH_5', 6: 'MATH_6' },
  },
  {
    id: 'algebra',
    label: 'Алгебра',
    description: '7–9 класс',
    grades: [7, 8, 9],
    color: 'blue',
    codes: { 7: 'ALGEBRA_7', 8: 'ALGEBRA_8', 9: 'ALGEBRA_9' },
  },
  {
    id: 'geometry',
    label: 'Геометрия',
    description: '7–9 класс',
    grades: [7, 8, 9],
    color: 'emerald',
    codes: { 7: 'GEOMETRY_7', 8: 'GEOMETRY_8', 9: 'GEOMETRY_9' },
  },
  {
    id: 'informatics',
    label: 'Информатика',
    description: '7–9 класс',
    grades: [7, 8, 9],
    color: 'cyan',
    codes: { 7: 'INFORMATICS_7', 8: 'INFORMATICS_8', 9: 'INFORMATICS_9' },
  },
  {
    id: 'vpr',
    label: 'ВПР',
    description: '5–9 класс',
    grades: [5, 6, 7, 8, 9],
    color: 'orange',
    codes: {
      5: 'VPR_5',
      6: 'VPR_6',
      7: 'VPR_7',
      8: 'VPR_8',
      9: 'VPR_9',
    },
  },
  {
    id: 'oge',
    label: 'ОГЭ',
    description: '9 класс',
    grades: [9],
    color: 'red',
    codes: { 9: 'OGE_9' },
  },
  {
    id: 'transfer',
    label: 'Переводной экзамен',
    description: '5–9 класс',
    grades: [5, 6, 7, 8, 9],
    color: 'pink',
    codes: {
      5: 'TRANSFER_5',
      6: 'TRANSFER_6',
      7: 'TRANSFER_7',
      8: 'TRANSFER_8',
      9: 'TRANSFER_9',
    },
  },
];

export type SubjectCategoryId =
  | 'math'
  | 'algebra'
  | 'geometry'
  | 'informatics'
  | 'vpr'
  | 'oge'
  | 'transfer';

/**
 * Возвращает список категорий, доступных ученику данного класса.
 * Например, для 7 класса — Алгебра, Геометрия, Информатика, ВПР, Переводной.
 * ОГЭ — только для 9.
 * Математика — только 5–6.
 */
export function getCategoriesForGrade(grade: number) {
  return SUBJECT_CATEGORIES.filter((c) => c.grades.includes(grade));
}

/**
 * Возвращает код предмета для категории + класс.
 * Например: 'algebra', 7 → 'ALGEBRA_7'
 */
export function getSubjectCode(
  categoryId: string,
  grade: number
): string | null {
  const cat = SUBJECT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  if (!cat.grades.includes(grade)) return null;
  return (cat.codes as Record<number, string>)[grade] || null;
}

/**
 * Преобразует массив категорий в массив кодов предметов.
 * Например: ['algebra', 'geometry'], 7 → ['ALGEBRA_7', 'GEOMETRY_7']
 */
export function categoriesToSubjectCodes(
  categoryIds: string[],
  grade: number
): string[] {
  return categoryIds
    .map((id) => getSubjectCode(id, grade))
    .filter((code): code is string => code !== null);
}

/**
 * По коду предмета возвращает название категории (для отображения).
 */
export function getCategoryByCode(code: string): string | null {
  for (const cat of SUBJECT_CATEGORIES) {
    const codes = Object.values(cat.codes);
    if (codes.includes(code)) return cat.id;
  }
  return null;
}

/**
 * Красивое имя предмета по коду.
 */
export const SUBJECT_NAMES: Record<string, string> = {
  MATH_5: 'Математика 5',
  MATH_6: 'Математика 6',
  ALGEBRA_7: 'Алгебра 7',
  ALGEBRA_8: 'Алгебра 8',
  ALGEBRA_9: 'Алгебра 9',
  GEOMETRY_7: 'Геометрия 7',
  GEOMETRY_8: 'Геометрия 8',
  GEOMETRY_9: 'Геометрия 9',
  INFORMATICS_7: 'Информатика 7',
  INFORMATICS_8: 'Информатика 8',
  INFORMATICS_9: 'Информатика 9',
  VPR_5: 'ВПР 5',
  VPR_6: 'ВПР 6',
  VPR_7: 'ВПР 7',
  VPR_8: 'ВПР 8',
  VPR_9: 'ВПР 9',
  OGE_9: 'ОГЭ 9',
  TRANSFER_5: 'Переводной 5',
  TRANSFER_6: 'Переводной 6',
  TRANSFER_7: 'Переводной 7',
  TRANSFER_8: 'Переводной 8',
  TRANSFER_9: 'Переводной 9',
};