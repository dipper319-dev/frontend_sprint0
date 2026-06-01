import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatCurrency,
  getCategories,
  getExpensesFromBackend,
  getIncomesFromBackend,
  saveIncomes,
  editarGasto,
  eliminarGasto,
  type Income,
  type Expense,
} from "@/lib/finance";
import { toast } from "sonner";

type Option = {
  id: string;
  kind: "income" | "expense";
  label: string;
};

export default function EditRecord() {
  const navigate = useNavigate();
  const categories = useMemo(() => getCategories(), []);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<string>("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [inc, exp] = await Promise.all([
          getIncomesFromBackend(),
          getExpensesFromBackend(),
        ]);
        setIncomes(inc);
        setExpenses(exp);
      } catch (error) {
        console.error("Error al cargar registros:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const options: Option[] = [
    ...incomes.map((i) => ({
      id: `income-${i.id}`,
      kind: "income" as const,
      label: `Ingreso · ${formatCurrency(i.monto)} · ${i.descripcion || "Sin descripción"}`,
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      kind: "expense" as const,
      label: `Gasto · ${formatCurrency(e.monto)} · ${e.descripcion || "Sin descripción"}`,
    })),
  ];

  const kind = selected.startsWith("income-") ? "income" : "expense";
  const rawId = selected.replace(/^(income|expense)-/, "");

  const handleSelect = (value: string) => {
    setSelected(value);
    if (value.startsWith("income-")) {
      const item = incomes.find((i) => i.id === value.replace("income-", ""));
      setMonto(item ? String(item.monto) : "");
      setDescripcion(item?.descripcion || "");
      setCategoriaId("");
    } else {
      const item = expenses.find((e) => e.id === value.replace("expense-", ""));
      setMonto(item ? String(item.monto) : "");
      setDescripcion(item?.descripcion || "");
      setCategoriaId(item?.categoriaId || "");
    }
  };

  const handleConfirm = async () => {
    if (!selected) { toast.error("Selecciona un registro"); return; }
    const amount = Number(monto);
    if (!amount || amount <= 0) { toast.error("Ingresa un monto válido"); return; }

    setSaving(true);
    try {
      if (kind === "income") {
        // Ingresos: localStorage (el backend de ingresos es solo lectura por ahora)
        const updated = incomes.map((i) =>
          i.id === rawId ? { ...i, monto: amount, descripcion } : i
        );
        saveIncomes(updated);
        setIncomes(updated);
        toast.success("Ingreso modificado exitosamente");
      } else {
        // Gastos: backend
        await editarGasto(
          Number(rawId),
          amount,
          descripcion,
          Number(categoriaId)
        );
        const exp = await getExpensesFromBackend();
        setExpenses(exp);
        toast.success("Gasto modificado exitosamente");
      }
      setSelected("");
      setMonto("");
      setDescripcion("");
      setCategoriaId("");
    } catch (error: any) {
      toast.error(error.message || "Error al modificar el registro");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) { toast.error("Selecciona un registro"); return; }
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) return;

    setSaving(true);
    try {
      if (kind === "income") {
        const updated = incomes.filter((i) => i.id !== rawId);
        saveIncomes(updated);
        setIncomes(updated);
        toast.success("Ingreso eliminado exitosamente");
      } else {
        await eliminarGasto(Number(rawId));
        const exp = await getExpensesFromBackend();
        setExpenses(exp);
        toast.success("Gasto eliminado exitosamente");
      }
      setSelected("");
      setMonto("");
      setDescripcion("");
      setCategoriaId("");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el registro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <Home size={20} className="text-foreground" />
        </Button>
        <Logo size="sm" showText={false} />
        <div className="w-10" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-center text-foreground">
          Seleccione el registro a modificar
        </h1>

        <Card className="shadow-card">
          <CardContent className="space-y-4 py-5">
            <div>
              <Label className="text-sm">Registro</Label>
              <Select value={selected} onValueChange={handleSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un registro" />
                </SelectTrigger>
                <SelectContent>
                  {options.length === 0 && (
                    <SelectItem value="none" disabled>Sin registros</SelectItem>
                  )}
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <>
                <div>
                  <Label className="text-sm">Monto</Label>
                  <Input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Descripción</Label>
                  <Input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {kind === "expense" && (
                  <div>
                    <Label className="text-sm">Categoría</Label>
                    <Select value={categoriaId} onValueChange={setCategoriaId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? "..." : "Eliminar"}
                  </Button>
                  <Button
                    className="gradient-hero text-primary-foreground"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Confirmar"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}