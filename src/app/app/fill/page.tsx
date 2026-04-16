import { RecordForm } from "@/components/RecordForm";

export default function FillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">填写档案</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          由导生或班委填写，支持多次追加记录；保存后可在学生详情页调用豆包分析。
        </p>
      </div>
      <RecordForm />
    </div>
  );
}
