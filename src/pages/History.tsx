import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatCurrency,
  getCategories,
  getExpensesFromBackend,
  getIncomesFromBackend,
} from "@/lib/finance";

type Item = {
  id: string;
  type: "Ingreso" | "Gasto";
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
  description: string;
};

export default function History() {
  const navigate = useNavigate();
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = useMemo(() => getCategories(), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incomes, expenses] = await Promise.all([
          getIncomesFromBackend(),
          getExpensesFromBackend(),
        ]);

        const incomeMapped = incomes.map((i) => ({
          id: `i-${i.id}`,
          type: "Ingreso" as const,
          amount: i.monto,
          date: i.fecha,
          categoryId: "ingreso",
          categoryName: "Ingreso",
          description: i.descripcion || "-",
        }));

        const expenseMapped = expenses.map((e) => ({
          id: `e-${e.id}`,
          type: "Gasto" as const,
          amount: e.monto,
          date: e.fecha,
          categoryId: e.categoriaId,
          categoryName: categories.find((c) => c.id === e.categoriaId)?.name || "Sin categoria",
          description: e.descripcion || "-",
        }));

        setItems([...incomeMapped, ...expenseMapped].sort((a, b) => (a.date < b.date ? 1 : -1)));
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categories]);

  const filtered = items.filter((it) => {
    if (type === "income" && it.type !== "Ingreso") return false;
    if (type === "expense" && it.type !== "Gasto") return false;
    if (categoryId !== "all" && it.categoryId !== categoryId) return false;
    return true;
  });

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
        <h1 className="text-xl font-semibold text-center text-foreground">Historial de movimientos</h1>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Tipo:</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Categoria:</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="py-6 text-center text-sm text-muted-foreground shadow-card">Sin movimientos.</Card>
          )}
          {filtered.map((it) => (
            <Card key={it.id} className="p-4 shadow-card">
              <p className={`text-sm font-semibold ${it.type === "Ingreso" ? "text-income" : "text-expense"}`}>
                {it.type}:
              </p>
              <p className={`text-lg font-bold ${it.type === "Ingreso" ? "text-income" : "text-expense"}`}>
                {it.type === "Ingreso" ? "+" : "-"}{formatCurrency(it.amount)}
              </p>
              <p className="text-sm text-muted-foreground">{new Date(it.date).toLocaleDateString("es-CL")}</p>
              <p className="text-sm text-foreground">{it.categoryName}</p>
              <p className="text-sm text-foreground">{it.description}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}