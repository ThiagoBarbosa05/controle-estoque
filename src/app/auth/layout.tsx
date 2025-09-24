import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticação - Controle de Estoque",
  description: "Sistema de controle de estoque - Faça login ou crie sua conta",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {children}
    </div>
  );
}
