import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency, getCategories, getExpensesFromBackend, getIncomesFromBackend } from "@/lib/finance";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Home } from "lucide-react";

const chartColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--destructive))", "hsl(var(--warning))"];

export default function Reports() {
  const navigate = useNavigate();
  const categories = useMemo(() => getCategories(), []);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [type, setType] = useState<"both" | "income" | "expense">("both");
  const [loading, setLoading] = useState(true);

  const [incomes, setIncomes] = useState<Array<{ monto: number; fecha: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ monto: number; fecha: string; categoriaId: string }>>([]);

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
        console.error("Error al cargar reportes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const inRange = (date: string) => {
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const fIncomes = (type === "expense" ? [] : incomes).filter((i) => inRange(i.fecha));
  const fExpenses = (type === "income" ? [] : expenses).filter(
    (e) => inRange(e.fecha) && (categoryId === "all" || e.categoriaId === categoryId)
  );

  const totalIncome = fIncomes.reduce((s, i) => s + i.monto, 0);
  const totalExpense = fExpenses.reduce((s, e) => s + e.monto, 0);
  const balance = totalIncome - totalExpense;

  const byCategory = categories
    .map((c, i) => {
      const items = fExpenses.filter((e) => e.categoriaId === c.id);
      const total = items.reduce((s, e) => s + e.monto, 0);
      return {
        id: c.id,
        name: c.name,
        count: items.length,
        total,
        percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
        color: chartColors[i % chartColors.length],
      };
    })
    .filter((c) => c.total > 0);

  const barData = [
    { name: "Ingresos", value: totalIncome, fill: "hsl(var(--income))" },
    { name: "Gastos", value: totalExpense, fill: "hsl(var(--expense))" },
  ];

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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={20} className="text-foreground" />
        </Button>
        <Logo size="sm" showText={false} />
        <div className="w-10" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-center text-foreground">Mis Reportes</h1>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Filtros</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Desde</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <Label className="text-xs">Filtrar por Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo de movimiento</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as typeof type)}
                  className="mt-1.5 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="expense" id="r-expense" />
                    <Label htmlFor="r-expense" className="text-sm font-normal">Gastos</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="income" id="r-income" />
                    <Label htmlFor="r-income" className="text-sm font-normal">Ingresos</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="both" id="r-both" />
                    <Label htmlFor="r-both" className="text-sm font-normal">Ambos</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución de gastos</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos en el rango.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {byCategory.map((cat, i) => {
                      const offset = byCategory.slice(0, i).reduce((s, c) => s + c.percentage, 0);
                      return (
                        <circle key={cat.id} cx="50" cy="50" r="40" fill="none"
                          stroke={cat.color} strokeWidth="20"
                          strokeDasharray={`${cat.percentage * 2.51} ${251.2 - cat.percentage * 2.51}`}
                          strokeDashoffset={`${-offset * 2.51}`} />
                      );
                    })}
                  </svg>
                </div>
                <div className="space-y-1.5 flex-1">
                  {byCategory.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-muted-foreground flex-1">{c.name}</span>
                      <span className="font-medium">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ingresos vs Gastos</CardTitle></CardHeader>
          <CardContent>
            {totalIncome === 0 && totalExpense === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin datos en el rango.</p>
            ) : (
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Resumen Financiero</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-sm font-bold text-income">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-sm font-bold text-expense">{formatCurrency(totalExpense)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-sm font-bold ${balance < 0 ? "text-expense" : "text-income"}`}>{formatCurrency(balance)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Detalle por categoría</CardTitle></CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 bg-muted text-xs font-semibold text-muted-foreground">
              <span>Categoría</span>
              <span className="text-right">N° Movimientos</span>
              <span className="text-right">Total Monto</span>
            </div>
            {byCategory.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">Sin gastos.</p>}
            {byCategory.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-2.5 text-sm border-t border-border">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="text-right text-muted-foreground">{c.count}</span>
                <span className="text-right font-semibold text-foreground">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 flex justify-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <Home size={22} className="text-primary" />
        </Button>
      </nav>
    </div>
  );
}