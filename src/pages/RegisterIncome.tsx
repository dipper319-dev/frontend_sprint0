import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RegisterIncome() {
  const navigate = useNavigate();
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const value = parseFloat(monto);
    if (!monto || isNaN(value) || value <= 0) {
      setError("El monto debe ser superior a cero");
      return;
    }

    setCargando(true);
    try {
      // ✨ HU-008: Obtener token
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No estás autenticado. Por favor, inicia sesión.");
        navigate("/");
        return;
      }

      // ✨ HU-008: Llamar a /api/transactions con tipo INGRESO
      const response = await fetch("http://localhost:8080/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: value,
          descripcion: descripcion.trim() || "Ingreso",
          tipo: "INGRESO",
          categoria: "OTROS",  // Obligatorio por ahora
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.mensaje || "Error al registrar el ingreso");
      }

      toast.success("Ingreso guardado exitosamente. Balance actualizado.");
      setMonto("");
      setDescripcion("");
      navigate("/dashboard");

    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
      console.error("Error detallado:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={22} />
        </Button>
        <span className="text-base font-semibold text-foreground ml-2">Registrar Ingreso</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-10 max-w-lg mx-auto w-full">
        <Logo size="sm" showText={false} />

        <h1 className="text-xl font-bold text-foreground mt-5 mb-8">Registrar Ingreso</h1>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Monto</label>
            <Input
              type="number"
              placeholder="0"
              value={monto}
              onChange={(e) => { 
                setMonto(e.target.value); 
                setError(""); 
              }}
              className="text-lg"
              min="0"
              step="any"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Descripción <span className="text-muted-foreground font-normal">(Opcional)</span>
            </label>
            <Textarea
              placeholder="Ej: Salario mensual"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button 
            type="submit" 
            disabled={cargando}
            className="w-full gradient-hero text-primary-foreground font-semibold h-12 text-base"
          >
            {cargando ? "Guardando..." : "Registrar"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            El campo de descripción puede quedar vacío
          </p>
        </form>
      </main>
    </div>
  );
}