export default function Loading() {
  return (
    <div className="p-6 animate-pulse space-y-4">
      {/* タイトルの骨 */}
      <div className="h-8 w-1/3 bg-muted rounded" />

      {/* カレンダー枠 */}
      <div className="h-40 w-full bg-muted rounded" />

      {/* セクションタイトル */}
      <div className="h-6 w-1/2 bg-muted rounded" />

      {/* カード部分 */}
      <div className="h-32 w-full bg-muted rounded" />
    </div>
  );
}
