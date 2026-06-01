import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, TrendingDown, TrendingUp, Target } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  getCategories,
  getExpensesFromBackend,
  getIncomesFromBackend,
  getBudgetFromBackend,
  getTotal,
} from "@/lib/finance";

type Tip = {
  id: string;
  icon: typeof Lightbulb;
  tone: "income" | "expense" | "primary";
  title: string;
  text: string;
};

export default function Recommendations() {
  const navigate = useNavigate();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const toneClass = useMemo(
    () => ({
      income: "text-income bg-income/10",
      expense: "text-expense bg-expense/10",
      primary: "text-primary bg-primary/10",
    }),
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incomes, expenses, budget] = await Promise.all([
          getIncomesFromBackend(),
          getExpensesFromBackend(),
          getBudgetFromBackend(),
        ]);

        const categories = getCategories();
        const totalIncome = getTotal(incomes);
        const totalExpense = getTotal(expenses);
        const balance = totalIncome - totalExpense;
        const result: Tip[] = [];

        if (budget && budget > 0) {
          const used = (totalExpense / budget) * 100;
          if (used >= 100) {
            result.push({
              id: "budget-over",
              icon: Target,
              tone: "expense",
              title: "Presupuesto superado",
              text: `Has gastado ${Math.round(used)}% de tu presupuesto. Pausa los gastos no esenciales hasta el próximo mes.`,
            });
          } else if (used > 80) {
            result.push({
              id: "budget-warn",
              icon: Target,
              tone: "expense",
              title: "Cerca de tu límite",
              text: `Vas en el ${Math.round(used)}% de tu presupuesto. Te quedan ${formatCurrency(budget - totalExpense)} para este mes.`,
            });
          } else {
            result.push({
              id: "budget-ok",
              icon: Target,
              tone: "income",
              title: "Presupuesto bajo control",
              text: `Llevas el ${Math.round(used)}% de tu presupuesto. ¡Buen trabajo manteniendo tus gastos!`,
            });
          }
        } else {
          result.push({
            id: "no-budget",
            icon: Target,
            tone: "primary",
            title: "Define un presupuesto",
            text: "Configura un presupuesto mensual para recibir alertas y controlar mejor tus gastos.",
          });
        }

        if (balance < 0) {
          result.push({
            id: "negative",
            icon: TrendingDown,
            tone: "expense",
            title: "Balance negativo",
            text: "Tus gastos superan tus ingresos. Revisa tus categorías con mayor gasto y reduce lo posible.",
          });
        } else if (totalIncome > 0) {
          const savingRate = Math.round((balance / totalIncome) * 100);
          result.push({
            id: "saving",
            icon: TrendingUp,
            tone: "income",
            title: "Capacidad de ahorro",
            text: `Estás ahorrando un ${savingRate}% de tus ingresos. Intenta destinar parte a un fondo de emergencia.`,
          });
        }

        const byCategory = categories
          .map((c) => ({
            name: c.name,
            total: expenses.filter((e) => e.categoriaId === c.id).reduce((s, e) => s + e.monto, 0),
          }))
          .sort((a, b) => b.total - a.total);

        if (byCategory[0]?.total > 0) {
          const top = byCategory[0];
          const share = totalExpense > 0 ? Math.round((top.total / totalExpense) * 100) : 0;
          result.push({
            id: "top-category",
            icon: Lightbulb,
            tone: "primary",
            title: `Mayor gasto: ${top.name}`,
            text: `"${top.name}" representa el ${share}% de tus gastos (${formatCurrency(top.total)}). Evalúa si puedes optimizarlo.`,
          });
        }

        if (result.length === 0) {
          result.push({
            id: "empty",
            icon: Lightbulb,
            tone: "primary",
            title: "Comienza a registrar",
            text: "Registra tus ingresos y gastos para recibir recomendaciones personalizadas.",
          });
        }

        setTips(result);
      } catch (error) {
        console.error("Error al cargar recomendaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          <ArrowLeft size={20} className="text-foreground" />
        </Button>
        <Logo size="sm" showText={false} />
        <div className="w-10" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-center text-foreground">Recomendaciones</h1>
        <p className="text-sm text-muted-foreground text-center">
          Consejos personalizados según tu actividad financiera.
        </p>

        <div className="space-y-3">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card key={tip.id} className="shadow-card">
                <CardContent className="flex gap-3 p-4">
                  <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${toneClass[tip.tone]}`}>
                    <Icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                    <p className="text-sm text-muted-foreground">{tip.text}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}