import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Lightbulb,
  DollarSign,
  Target,
  Tags,
  Settings,
  AlertTriangle,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { 
  formatCurrency, 
  getCategories, 
  getExpensesFromBackend, 
  getBalanceFromBackend,
  getIncomesFromBackend,
  getBudgetFromBackend,
  getMonthlyBudget, 
  getTotal,
  editarGasto,
  eliminarGasto,
} from "@/lib/finance";

const chartColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--destructive))", "hsl(var(--warning))"];

interface GastoType {
  id: string;
  monto: number;
  descripcion?: string;
  categoriaId: string;
  fecha: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName] = useState("Usuario");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; percentage: number; color: string }>>([]);
  const [alertType, setAlertType] = useState<"preventive" | "critical" | null>(null);
  const [loading, setLoading] = useState(true);

  // ✨ HU009: Estados para editar/eliminar gastos
  const [mostrarListadoGastos, setMostrarListadoGastos] = useState(false);
  const [gastos, setGastos] = useState<GastoType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState({
    monto: "",
    descripcion: "",
    categoriaId: "",
  });
  const [cargandoEdicion, setCargandoEdicion] = useState(false);

  // ✨ HU-008: Cargar datos (ingresos + gastos del backend)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // ✨ NUEVO: Obtener ingresos del backend
        const incomes = await getIncomesFromBackend();
        const incomesTotal = getTotal(incomes);
        setTotalIncome(incomesTotal);

        // Obtener balance desde el backend (gastos)
        const balance = await getBalanceFromBackend();
        
        if (balance) {
          setTotalExpenses(balance.totalGastos);
          
          // Cargar presupuesto desde backend, con fallback a localStorage
          const budgetFromBackend = await getBudgetFromBackend();
          const budget = budgetFromBackend != null ? budgetFromBackend : getMonthlyBudget();
          setMonthlyBudget(budget);
          
          const usedPercentage = budget > 0 ? (balance.totalGastos / budget) * 100 : 0;
          if (usedPercentage >= 100) setAlertType("critical");
          else if (usedPercentage > 80) setAlertType("preventive");
        }

        // Obtener gastos del backend para categorías
        const expenses = await getExpensesFromBackend();
        const cats = getCategories();
        setCategories(cats);
        
        // ✨ HU009: Guardar gastos para listado y edición
        setGastos(expenses as GastoType[]);
        
        const expenseTotal = getTotal(expenses);
        const categoryTotals = cats
          .map((category, index) => {
            const total = expenses
              .filter((expense) => expense.categoriaId === category.id)
              .reduce((sum, expense) => sum + expense.monto, 0);
            return {
              name: category.name,
              percentage: expenseTotal > 0 ? Math.round((total / expenseTotal) * 100) : 0,
              color: chartColors[index % chartColors.length],
            };
          })
          .filter((category) => category.percentage > 0);

        setCategoryData(
          categoryTotals.length 
            ? categoryTotals 
            : cats.slice(0, 5).map((category, index) => ({ 
                name: category.name, 
                percentage: 0, 
                color: chartColors[index] 
              }))
        );

      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✨ HU009: Manejar edición de gasto
  const handleAbrirEditar = (gasto: GastoType) => {
    setEditandoId(gasto.id);
    setFormEdit({
      monto: gasto.monto.toString(),
      descripcion: gasto.descripcion || "",
      categoriaId: gasto.categoriaId,
    });
  };

  const handleGuardarEdicion = async () => {
    if (!editandoId || !formEdit.monto || !formEdit.descripcion || !formEdit.categoriaId) {
      toast.error("Completa todos los campos");
      return;
    }

    setCargandoEdicion(true);
    try {
      await editarGasto(
        Number(editandoId),
        Number(formEdit.monto),
        formEdit.descripcion,
        Number(formEdit.categoriaId)
      );
      
      toast.success("Gasto editado correctamente");
      setEditandoId(null);
      
      // Recargar gastos
      const expenses = await getExpensesFromBackend();
      setGastos(expenses as GastoType[]);
      
      // Recargar balance
      const balance = await getBalanceFromBackend();
      if (balance) {
        setTotalExpenses(balance.totalGastos);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al editar el gasto");
    } finally {
      setCargandoEdicion(false);
    }
  };

  // ✨ HU009: Manejar eliminación de gasto
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      return;
    }

    try {
      await eliminarGasto(Number(id));
      toast.success("Gasto eliminado correctamente");
      
      // Recargar gastos
      setGastos(gastos.filter(g => g.id !== id));
      
      // Recargar balance
      const balance = await getBalanceFromBackend();
      if (balance) {
        setTotalExpenses(balance.totalGastos);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el gasto");
    }
  };

  const budgetPercentage = monthlyBudget > 0 ? Math.min((totalExpenses / monthlyBudget) * 100, 100) : 0;

  const handleLogout = () => {
    toast.success("Sesión cerrada");
    localStorage.removeItem("authToken");
    navigate("/");
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-card">
        <span className="text-base font-semibold text-foreground">
          Hola, {userName}!
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <Dialog open={!!alertType} onOpenChange={(open) => !open && setAlertType(null)}>
        <DialogContent className="max-w-sm rounded-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${alertType === "critical" ? "text-destructive" : "text-warning"}`}>
              <AlertTriangle size={22} />
              {alertType === "critical" ? "ALERTA CRÍTICA" : "ALERTA PREVENTIVA"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {alertType === "critical"
              ? "Has alcanzado o superado el 100% de tu presupuesto mensual. Revisa tus gastos para evitar desbalances."
              : "Has superado el 80% de tu presupuesto mensual. Considera reducir tus próximos gastos."}
          </p>
          <Button className="gradient-hero text-primary-foreground" onClick={() => setAlertType(null)}>Entendido</Button>
        </DialogContent>
      </Dialog>

      {/* Modal de edición HU009 */}
      <Dialog open={!!editandoId} onOpenChange={(open) => !open && setEditandoId(null)}>
        <DialogContent className="max-w-sm rounded-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Monto</label>
              <Input
                type="number"
                value={formEdit.monto}
                onChange={(e) => setFormEdit({ ...formEdit, monto: e.target.value })}
                className="mt-1"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripción</label>
              <Input
                type="text"
                value={formEdit.descripcion}
                onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Categoría</label>
              <Select value={formEdit.categoriaId} onValueChange={(val) => setFormEdit({ ...formEdit, categoriaId: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditandoId(null)}
                disabled={cargandoEdicion}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardarEdicion}
                disabled={cargandoEdicion}
                className="flex-1 gradient-hero text-primary-foreground"
              >
                {cargandoEdicion ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="sm" showText={false} />
        </div>

        {/* Presupuesto mensual */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Presupuesto mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${budgetPercentage >= 100 ? "bg-destructive" : "gradient-hero"}`} 
                style={{ width: `${budgetPercentage}%` }} 
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{Math.round(budgetPercentage)}% utilizado</span>
              <span>{formatCurrency(totalExpenses)} / {monthlyBudget ? formatCurrency(monthlyBudget) : "Sin límite"}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/budget")}>
              Configurar presupuesto
            </Button>
          </CardContent>
        </Card>

        {/* Balances financieros */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-primary" />
              Balances financieros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalIncome - totalExpenses < 0 ? "text-destructive" : "text-income"}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </CardContent>
        </Card>

        {/* Transacciones por categorías */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart size={16} className="text-primary" />
              Transacciones por categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Simple pie chart representation */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {categoryData.reduce((acc, cat, i) => {
                    const offset = categoryData.slice(0, i).reduce((s, c) => s + c.percentage, 0);
                    acc.push(
                      <circle
                        key={cat.name}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="20"
                        strokeDasharray={`${cat.percentage * 2.51} ${251.2 - cat.percentage * 2.51}`}
                        strokeDashoffset={`${-offset * 2.51}`}
                      />
                    );
                    return acc;
                  }, [] as React.ReactNode[])}
                </svg>
              </div>
              <div className="space-y-1.5 flex-1">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-muted-foreground flex-1">{cat.name}</span>
                    <span className="font-medium text-foreground">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registros */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Registros</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate("/register-income")}>
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp size={24} className="text-income" />
                </div>
                <span className="text-sm font-medium text-foreground">Ingresos</span>
                <span className="text-lg font-bold text-income">{formatCurrency(totalIncome)}</span>
              </CardContent>
            </Card>
            {/* ✨ HU009: Card de gastos muestra datos y permite ver listado */}
            <Card 
              className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow" 
              onClick={() => setMostrarListadoGastos(!mostrarListadoGastos)}
            >
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingDown size={24} className="text-expense" />
                </div>
                <span className="text-sm font-medium text-foreground">Gastos</span>
                <span className="text-lg font-bold text-expense">{formatCurrency(totalExpenses)}</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ✨ HU009: Listado de gastos con editar/eliminar */}
        {mostrarListadoGastos && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Mis Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {gastos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay gastos registrados</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gastos.map((gasto) => (
                    <div key={gasto.id} className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-secondary/50 transition">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{gasto.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{gasto.categoriaId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-expense">${Number(gasto.monto).toFixed(2)}</span>
                        <button 
                          onClick={() => handleAbrirEditar(gasto)}
                          className="p-1 hover:bg-primary/10 rounded-md transition"
                          title="Editar"
                        >
                          <Edit2 size={16} className="text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleEliminar(gasto.id)}
                          className="p-1 hover:bg-destructive/10 rounded-md transition"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full" 
                onClick={() => navigate("/register-expense")}
              >
                Registrar nuevo gasto
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reportes & Recomendaciones */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow">
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <FileText size={24} className="text-info" />
              </div>
              <span className="text-sm font-medium text-foreground">Reportes</span>
            </CardContent>
          </Card>
          <Card className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate("/categories")}>
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Tags size={24} className="text-warning" />
              </div>
              <span className="text-sm font-medium text-foreground">Categorías</span>
            </CardContent>
          </Card>
        </div>

        <Button variant="ghost" className="w-full gap-2" onClick={() => navigate("/budget")}>
          <Settings size={18} /> Ajustar presupuesto mensual
        </Button>
      </main>
    </div>
  );
}