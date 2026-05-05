import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Logo size="lg" />

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido a tu gestor financiero
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Administra tus ingresos, gastos y mejora tu salud financiera
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button asChild size="lg" className="w-full text-base font-semibold">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full text-base font-semibold">
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
