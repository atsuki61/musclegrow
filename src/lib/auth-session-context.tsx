"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * AuthSessionContextの型定義
 * userIdは未ログイン時に null となる
 */
interface AuthSessionContextType {
  userId: string | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | null>(null);

/**
 * AuthSessionProviderのProps
 */
interface AuthSessionProviderProps {
  children: ReactNode;
  userId: string | null;
}

/**
 * 認証セッション情報を提供するProvider
 * userIdをClient Component配下に提供
 */
export function AuthSessionProvider({
  children,
  userId,
}: AuthSessionProviderProps) {
  return (
    <AuthSessionContext.Provider value={{ userId }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

/**
 * Client ComponentでuserIdを取得するフック
 */
export function useAuthSession(): AuthSessionContextType {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
