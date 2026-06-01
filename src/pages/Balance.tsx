import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, TrendingUp, TrendingDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  getIncomesFromBackend,
  getBalanceFromBackend,
  getExpensesFromBackend,
} from "@/lib/finance";

type Movement = {
  id: string;
  type: "income" | "expense";
  name: string;
  date: string;
  amount: number;
};

export default function Balance() {
  const navigate = useNavigate();
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incomes, balance, expenses] = await Promise.all([
          getIncomesFromBackend(),
          getBalanceFromBackend(),
          getExpensesFromBackend(),
        ]);

        if (balance) {
          setIncome(balance.totalIngresos);
          setExpense(balance.totalGastos);
        }

        const all: Movement[] = [
          ...incomes.map((i) => ({
            id: `i-${i.id}`,
            type: "income" as const,
            name: i.descripcion || "Ingreso",
            date: i.fecha,
            amount: i.monto,
          })),
          ...expenses.map((e) => ({
            id: `e-${e.id}`,
            type: "expense" as const,
            name: e.descripcion || "Gasto",
            date: e.fecha,
            amount: e.monto,
          })),
        ].sort((a, b) => (a.date < b.date ? 1 : -1));

        setMovements(all.slice(0, 10));
      } catch (error) {
        console.error("Error al cargar balance:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const balance = income - expense;

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
        <h1 className="text-xl font-semibold text-center text-foreground">Balance neto</h1>

        <Card className="shadow-elevated">
          <CardContent className="py-6 flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Balance total</span>
            <div className={`w-full rounded-xl py-4 text-center ${balance < 0 ? "bg-expense/10" : "bg-income/10"}`}>
              <p className={`text-4xl font-bold ${balance < 0 ? "text-expense" : "text-income"}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <TrendingUp size={14} className="text-income" /> Ingresos
              </div>
              <div className="w-full rounded-lg bg-income/10 py-2 text-center">
                <span className="text-lg font-bold text-income">{formatCurrency(income)}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <TrendingDown size={14} className="text-expense" /> Gastos
              </div>
              <div className="w-full rounded-lg bg-expense/10 py-2 text-center">
                <span className="text-lg font-bold text-expense">{formatCurrency(expense)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Movimientos recientes</h3>
          <Card className="shadow-card divide-y divide-border">
            {movements.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">Aún no hay movimientos.</div>
            )}
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("es-CL")}</span>
                </div>
                <span className={`text-sm font-semibold ${m.type === "income" ? "text-income" : "text-expense"}`}>
                  {m.type === "income" ? "+" : "-"}{formatCurrency(m.amount)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </main>
    </div>
  );
}