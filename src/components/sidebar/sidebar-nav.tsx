"use client";

import { cn } from "@/lib/utils";
import { Home, ListChecks, UserCheck, Users, Wine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    href: "/wines-list",
    icon: ListChecks,
    description: "Gerenciar listas de vinhos dos clientes",
  },
];

// Componente da navegação lateral
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-1 sm:flex-col  gap-2 sm:justify-center justify-between"
      )}
    >
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            // onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            title={item.title}
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </nav>
  );
}
