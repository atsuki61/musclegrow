import { Suspense } from "react";
import { RecordPage } from "@/components/features/record";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          読み込み中...
        </div>
      }
    >
      <RecordPage />
    </Suspense>
  );
}
