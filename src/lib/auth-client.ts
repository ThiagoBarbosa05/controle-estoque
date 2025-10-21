import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://controle-estoque-eight-eta.vercel.app",
  // baseURL: "http://localhost:3000",
});

export const { signIn, signUp, useSession, signOut } = authClient;
