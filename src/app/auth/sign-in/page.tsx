"use client";

import { useState } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redireciona se já estiver logado
  if (session?.user) {
    router.replace("/dashboard");
    return null;
  }

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Erro ao autenticar");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError((err as Error)?.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Controle de Estoque
              </CardTitle>
              <CardDescription className="mt-2">
                Entre para acessar sua conta e gerenciar seu estoque
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Ocultar senha" : "Mostrar senha"}
                    </span>
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar na conta"
                )}
              </Button>
            </form>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => router.push("/auth/sign-up")}
                >
                  Criar conta gratuita
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <button type="button" className="underline hover:no-underline">
              Termos de Serviço
            </button>{" "}
            e{" "}
            <button type="button" className="underline hover:no-underline">
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
