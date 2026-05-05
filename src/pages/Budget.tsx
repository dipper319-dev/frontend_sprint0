import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { getBudgetFromBackend, saveBudgetToBackend } from "@/lib/finance";

export default function Budget() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const value = await getBudgetFromBackend();
        if (value != null && value > 0) {
          setAmount(String(value));
        }
      } catch {
        // silently fall back to empty
      } finally {
        setLoading(false);
      }
    };
    loadBudget();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);

    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("El presupuesto debe ser un valor positivo mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const result = await saveBudgetToBackend(value);
      if (!result.ok) {
        setError(result.error || "Error al guardar el presupuesto");
        return;
      }
      toast.success(result.mensaje || "Presupuesto configurado con éxito");
      navigate("/dashboard");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={22} />
        </Button>
        <span className="text-base font-semibold text-foreground ml-2">
          Configuración de Presupuesto
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 max-w-lg mx-auto w-full">
        <Logo size="sm" showText={false} />
        <h1 className="text-xl font-bold text-foreground mt-5 mb-2">Presupuesto mensual</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Define el límite de gasto mensual. Se usará para calcular alertas de consumo.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando presupuesto actual...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="budget-amount" className="text-sm font-medium text-foreground">
                Monto mensual <span className="text-destructive">*</span>
              </label>
              <Input
                id="budget-amount"
                type="number"
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="Ej: 500000"
                className={`text-lg ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                aria-describedby={error ? "budget-error" : undefined}
                aria-required="true"
                disabled={saving}
              />
              {error && (
                <p id="budget-error" className="text-sm text-destructive font-medium" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-hero text-primary-foreground font-semibold h-12 text-base"
              disabled={saving || !amount}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Presupuesto"
              )}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
