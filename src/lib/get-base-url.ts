export const getBaseURL = (options?: { useCommitURL?: boolean }) => {
  // クライアント側では window.location.origin を使用
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // サーバー側の処理
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
  const url = isProd
    ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    : options?.useCommitURL
    ? process.env.NEXT_PUBLIC_VERCEL_URL
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;

  return url
    ? `https://${url}`
    : `http://localhost:${process.env.PORT || 3000}`;
};
