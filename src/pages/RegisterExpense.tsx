import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";

interface Category {
  id: number;
  nombre: string;
}

interface AlertaPresupuesto {
  tipoAlerta: "PREVENTIVA" | "CRITICA";
  porcentajeConsumo: number;
  montoGastado: number;
  presupuesto: number;
}

export default function RegisterExpense() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState<AlertaPresupuesto | null>(null);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // ✨ Cargar categorías del backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch("http://localhost:8080/api/categorias", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const cats = data.data || [];
        setCategories(cats);
        
        if (cats.length > 0) {
          setCategoriaId(String(cats[0].id));
        }
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    };

    loadCategories();
  }, []);

  const obtenerAlerta = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("http://localhost:8080/api/alertas/presupuesto", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.data && data.data.tieneAlerta) {
        setAlerta({
          tipoAlerta: data.data.tipoAlerta,
          porcentajeConsumo: data.data.porcentajeConsumo,
          montoGastado: data.data.montoGastado,
          presupuesto: data.data.presupuesto,
        });
        setMostrarAlerta(true);
      }
    } catch (err) {
      console.error("Error al obtener alerta:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const value = Number(monto);
    if (!monto || Number.isNaN(value) || value <= 0) {
      setError("El monto debe ser superior a cero");
      return;
    }
    if (!categoriaId) {
      setError("Selecciona una categoría");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }

    setCargando(true);
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("No estás autenticado. Por favor, inicia sesión.");
        navigate("/");
        return;
      }

      // ✨ Usar directamente el ID de la categoría del backend
      const backendCategoryId = parseInt(categoriaId);

      const response = await fetch("http://localhost:8080/api/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: value,
          descripcion: descripcion.trim(),
          categoriaId: backendCategoryId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.mensaje || "Error al registrar el gasto");
      }

      toast.success("Gasto guardado exitosamente.");

      // ✨ Obtener y mostrar alerta si existe
      await obtenerAlerta();

      // Limpiar formulario
      setMonto("");
      setDescripcion("");
      if (categories.length > 0) {
        setCategoriaId(String(categories[0].id));
      }

    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
      console.error("Error detallado:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={22} />
        </Button>
        <span className="text-base font-semibold text-foreground ml-2">Registrar Gasto</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 max-w-lg mx-auto w-full">
        <Logo size="sm" showText={false} />
        <h1 className="text-xl font-bold text-foreground mt-5 mb-8">Registrar Gasto</h1>

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
            <label className="text-sm font-medium text-foreground">Categoría</label>
            <Select value={categoriaId} onValueChange={(value) => { 
              setCategoriaId(value); 
              setError(""); 
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descripción</label>
            <Textarea 
              placeholder="Ej: Compra supermercado" 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              rows={3} 
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <Button 
            type="submit" 
            disabled={cargando} 
            className="w-full gradient-hero text-primary-foreground font-semibold h-12 text-base"
          >
            {cargando ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </main>

      {/* ✨ MODAL DE ALERTA */}
      {mostrarAlerta && alerta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-card border-2 rounded-lg p-6 max-w-sm w-full mx-4 ${
            alerta.tipoAlerta === "CRITICA" ? "border-red-500" : "border-yellow-500"
          }`}>
            {/* Icono */}
            <div className="flex justify-center mb-4">
              {alerta.tipoAlerta === "CRITICA" ? (
                <AlertTriangle size={48} className="text-red-500" />
              ) : (
                <AlertCircle size={48} className="text-yellow-500" />
              )}
            </div>

            {/* Título */}
            <h2 className={`text-xl font-bold text-center mb-2 ${
              alerta.tipoAlerta === "CRITICA" ? "text-red-500" : "text-yellow-500"
            }`}>
              {alerta.tipoAlerta === "CRITICA" 
                ? "¡Presupuesto Excedido!" 
                : "⚠️ Alerta de Presupuesto"}
            </h2>

            {/* Mensaje */}
            <p className="text-center text-sm text-muted-foreground mb-4">
              {alerta.tipoAlerta === "CRITICA" 
                ? `Has excedido tu presupuesto mensual. Consumo: ${alerta.porcentajeConsumo.toFixed(1)}%`
                : `Te acercas al límite de tu presupuesto. Consumo: ${alerta.porcentajeConsumo.toFixed(1)}%`}
            </p>

            {/* Detalles */}
            <div className="bg-background rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Presupuesto:</span>
                <span className="font-semibold">${alerta.presupuesto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastado:</span>
                <span className="font-semibold">${alerta.montoGastado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consumo:</span>
                <span className={`font-semibold ${
                  alerta.tipoAlerta === "CRITICA" ? "text-red-500" : "text-yellow-500"
                }`}>
                  {alerta.porcentajeConsumo.toFixed(1)}%
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3">
                <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      alerta.tipoAlerta === "CRITICA" ? "bg-red-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${Math.min(alerta.porcentajeConsumo, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                onClick={() => setMostrarAlerta(false)}
                variant="outline"
                className="flex-1"
              >
                Entendido
              </Button>
              <Button
                onClick={() => {
                  setMostrarAlerta(false);
                  navigate("/dashboard");
                }}
                className="flex-1 gradient-hero text-primary-foreground"
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}