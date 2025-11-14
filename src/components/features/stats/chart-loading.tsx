/**
 * グラフのローディング表示コンポーネント（共通化）
 */
export function ChartLoading() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <p className="text-muted-foreground">読み込み中...</p>
    </div>
  );
}

