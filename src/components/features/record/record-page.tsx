"use client";

export function RecordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Headerエリア（後で実装） */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Headerコンテンツは後で実装 */}
            <div className="text-lg font-bold">記録</div>
          </div>
        </div>
      </header>

      {/* 部位ナビゲーションエリア（後で実装） */}
      <nav className="sticky top-14 z-40 w-full border-b bg-background">
        <div className="container mx-auto px-4">
          {/* 部位ナビゲーションコンテンツは後で実装 */}
          <div className="flex h-12 items-center">部位ナビゲーション</div>
        </div>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* 部位カードは後で実装 */}
          <p className="text-muted-foreground text-center py-8">
            部位カードがここに表示されます
          </p>
        </div>
      </main>
    </div>
  );
}
