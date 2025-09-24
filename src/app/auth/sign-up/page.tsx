"use client";

import { useState } from "react";
import { signUp, useSession } from "@/lib/auth-client";
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
import { Eye, EyeOff, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6)
      return { strength: 1, text: "Muito fraca", color: "text-red-500" };
    if (password.length < 8)
      return { strength: 2, text: "Fraca", color: "text-orange-500" };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, text: "Média", color: "text-yellow-500" };
    }
    return { strength: 4, text: "Forte", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Redireciona se já estiver logado
  if (session?.user) {
    router.replace("/dashboard");
    return null;
  }

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Limpa o erro ao digitar
      if (error) setError("");
    };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email é obrigatório");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email deve ter um formato válido");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não coincidem");
      return false;
    }
    return true;
  };

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const result = await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (result.error) {
        setError(result.error.message || "Erro ao criar conta");
      } else {
        // Conta criada com sucesso
        // Better-auth automaticamente faz login após registro bem-sucedido
        router.replace("/dashboard");
      }
    } catch (err) {
      setError((err as Error)?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/auth/sign-in"
                className="absolute left-6 top-6 inline-flex items-center justify-center rounded-md w-10 h-10 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para login</span>
              </Link>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
              <CardDescription className="mt-2">
                Preencha os dados abaixo para criar sua conta
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nome completo
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  disabled={loading}
                  required
                  autoComplete="name"
                  className="h-11"
                />
              </div>

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
                  value={formData.email}
                  onChange={handleInputChange("email")}
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
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    disabled={loading}
                    required
                    autoComplete="new-password"
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
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Força da senha:
                      </span>
                      <span
                        className={`text-xs font-medium ${passwordStrength.color}`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.strength
                              ? level === 1
                                ? "bg-red-500"
                                : level === 2
                                ? "bg-orange-500"
                                : level === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {formData.password.length > 0 &&
                      passwordStrength.strength < 4 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {passwordStrength.strength < 3
                            ? "Use letras maiúsculas, minúsculas e números para uma senha mais forte"
                            : "Adicione símbolos especiais para uma senha mais segura"}
                        </p>
                      )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                    className={`h-11 pr-10 ${
                      formData.confirmPassword.length > 0 &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    </span>
                  </Button>
                </div>
                {formData.confirmPassword.length > 0 &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      As senhas não coincidem
                    </p>
                  )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={
                  loading ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.password.trim() ||
                  !formData.confirmPassword.trim() ||
                  formData.password !== formData.confirmPassword
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
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
                Já tem uma conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => router.push("/auth/sign-in")}
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
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
