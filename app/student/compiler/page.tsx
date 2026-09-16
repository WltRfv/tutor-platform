import { CodeCompiler } from '@/components/student/CodeCompiler';

export default function CompilerPage() {
  return (
    <div className="p-8 max-w-7xl min-h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Компилятор</h1>
        <p className="text-slate-400">
          Пиши код, запускай и проверяй результат. Все запуски видит учитель.
        </p>
      </div>
      <CodeCompiler />
    </div>
  );
}