"use client";

import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/sign-in");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="p-4 border-t">
      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
