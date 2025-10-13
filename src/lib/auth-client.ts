import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://controle-estoque-eight-eta.vercel.app",
});

export const { signIn, signUp, useSession, signOut } = authClient;
