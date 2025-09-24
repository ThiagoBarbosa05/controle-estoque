"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wine,
  UserCheck,
  ListChecks,
  Menu,
  Home,
  LogOut,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";

// Definir itens de navegação
const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Visão geral do sistema",
  },
  {
    title: "Clientes",
    href: "/customers",
    icon: Users,
    description: "Gerenciar clientes",
  },
  {
    title: "Vinhos",
    href: "/wines",
    icon: Wine,
    description: "Gerenciar vinhos",
  },
  {
    title: "Usuários",
    href: "/users",
    icon: UserCheck,
    description: "Gerenciar usuários do sistema",
  },
  {
    title: "Listas de Vinhos",
    href: "/customer-wines",
    icon: ListChecks,
    description: "Gerenciar listas de vinhos dos clientes",
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se o usuário está autenticado
  if (!isPending && !session) {
    router.push("/auth/sign-in");
    return null;
  }

  // Função para realizar logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/sign-in");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Função para gerar iniciais do usuário
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Componente da navegação lateral
  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("space-y-2", mobile && "px-4")}>
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground font-medium",
              sidebarCollapsed && !mobile && "justify-center px-2"
            )}
            title={sidebarCollapsed && !mobile ? item.title : undefined}
          >
            <Icon className="h-4 w-4" />
            {(!sidebarCollapsed || mobile) && (
              <span className="truncate">{item.title}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // Componente do Avatar simples
  const UserAvatar = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

    return (
      <div
        className={cn(
          "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium",
          sizeClasses
        )}
      >
        {session?.user?.name ? getUserInitials(session.user.name) : "U"}
      </div>
    );
  };

  // Componente do header do usuário
  const UserHeader = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex items-center gap-3 p-4", mobile && "border-b")}>
      <UserAvatar />
      {(!sidebarCollapsed || mobile) && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {session?.user?.name || "Usuário"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {session?.user?.email}
          </p>
        </div>
      )}
      {(!sidebarCollapsed || mobile) && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Menu dropdown simples */}
          {userMenuOpen && (
            <>
              {/* Overlay para fechar o menu */}
              <button
                type="button"
                className="fixed inset-0 z-10 bg-transparent"
                onClick={() => setUserMenuOpen(false)}
                aria-label="Fechar menu"
              />
              {/* Menu */}
              <div className="absolute right-0 top-10 z-20 w-56 rounded-md border bg-popover p-1 shadow-md">
                <div className="px-2 py-1.5 text-sm font-medium">
                  Minha Conta
                </div>
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col border-r bg-muted/10 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header do usuário */}
        <UserHeader />

        {/* Navegação */}
        <div className="flex-1 p-4">
          <SidebarNav />
        </div>

        {/* Botão de colapsar sidebar */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("w-full", sidebarCollapsed && "px-2")}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Recolher
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Menu Mobile - Overlay */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r z-50 md:hidden">
            {/* Header mobile */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <UserHeader mobile />
            <div className="flex-1 p-4">
              <SidebarNav mobile />
            </div>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <h1 className="text-lg font-semibold">Controle de Estoque</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
