export type Category = {
  id: string;
  name: string;
};

export type Income = {
  id: string;
  monto: number;
  descripcion?: string;
  fecha: string;
};

export type Expense = {
  id: string;
  monto: number;
  descripcion?: string;
  categoriaId: string;
  fecha: string;
};

export type BalanceResponse = {
  balanceInicial: number;
  totalIngresos: number;
  totalGastos: number;
  balanceActual: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "ALIMENTACION", name: "Alimentación" },
  { id: "TRANSPORTE", name: "Transporte" },
  { id: "ENTRETENIMIENTO", name: "Entretenimiento" },
  { id: "SERVICIOS", name: "Servicios" },
  { id: "OTROS", name: "Otros" },
];

const API_URL = "http://localhost:8080";

const getToken = () => localStorage.getItem("authToken");

export const getBalanceFromBackend = async (): Promise<BalanceResponse | null> => {
  try {
    const token = getToken();
    if (!token) {
      console.error("No hay token disponible");
      return null;
    }

    const response = await fetch(`${API_URL}/api/gastos/balance`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener balance: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getBalanceFromBackend:", error);
    return null;
  }
};

export const getExpensesFromBackend = async (): Promise<Expense[]> => {
  try {
    const token = getToken();
    if (!token) {
      console.error("No hay token disponible");
      return [];
    }

    const response = await fetch(`${API_URL}/api/gastos`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener gastos: ${response.statusText}`);
    }

    const gastos = await response.json();

    return gastos.map((gasto: any) => ({
      id: String(gasto.id),
      monto: Number(gasto.monto),
      descripcion: gasto.descripcion,
      categoriaId: gasto.categoria || "OTROS",
      fecha: gasto.fechaTransaccion,
    }));
  } catch (error) {
    console.error("Error en getExpensesFromBackend:", error);
    return [];
  }
};

// ✨ NUEVO: Obtener ingresos desde el backend
export const getIncomesFromBackend = async (): Promise<Income[]> => {
  try {
    const token = getToken();
    if (!token) {
      console.error("No hay token disponible");
      return [];
    }

    const response = await fetch(`${API_URL}/api/transactions`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener transacciones: ${response.statusText}`);
    }

    const transacciones = await response.json();

    // Filtrar solo ingresos
    return transacciones
      .filter((t: any) => t.tipo === "INGRESO")
      .map((t: any) => ({
        id: String(t.id),
        monto: Number(t.monto),
        descripcion: t.descripcion,
        fecha: t.fechaTransaccion,
      }));
  } catch (error) {
    console.error("Error en getIncomesFromBackend:", error);
    return [];
  }
};

// ✨ NUEVO HU009: Editar un gasto
export const editarGasto = async (
  id: number,
  monto: number,
  descripcion: string,
  categoriaId: number
): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No hay token disponible");
    }

    const response = await fetch(`${API_URL}/api/gastos/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ monto, descripcion, categoriaId }),
    });

    if (!response.ok) {
      throw new Error(`Error al editar gasto: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en editarGasto:", error);
    throw error;
  }
};

// ✨ NUEVO HU009: Eliminar un gasto
export const eliminarGasto = async (id: number): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No hay token disponible");
    }

    const response = await fetch(`${API_URL}/api/gastos/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar gasto: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en eliminarGasto:", error);
    throw error;
  }
};

export const getBudgetFromBackend = async (): Promise<number | null> => {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/api/presupuesto`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.presupuestoMensual != null ? Number(data.presupuestoMensual) : null;
  } catch (error) {
    console.error("Error en getBudgetFromBackend:", error);
    return null;
  }
};

export const saveBudgetToBackend = async (amount: number): Promise<{ ok: boolean; mensaje?: string; error?: string }> => {
  const token = getToken();
  if (!token) return { ok: false, error: "No hay sesión activa" };

  const response = await fetch(`${API_URL}/api/presupuesto`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ presupuestoMensual: amount }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { ok: false, error: data.error || "Error al guardar el presupuesto" };
  }

  localStorage.setItem("monthlyBudget", String(amount));
  return { ok: true, mensaje: data.mensaje };
};


const readArray = <T>(key: string, fallback: T[]): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

export const getCategories = () => readArray<Category>("categories", DEFAULT_CATEGORIES);
export const saveCategories = (categories: Category[]) => localStorage.setItem("categories", JSON.stringify(categories));

export const getIncomes = () => readArray<Income>("incomes", []);
export const saveIncomes = (incomes: Income[]) => localStorage.setItem("incomes", JSON.stringify(incomes));

export const getExpenses = async () => {
  const expensesFromBackend = await getExpensesFromBackend();
  if (expensesFromBackend.length > 0) {
    return expensesFromBackend;
  }
  return readArray<Expense>("expenses", []);
};

export const saveExpenses = (expenses: Expense[]) => localStorage.setItem("expenses", JSON.stringify(expenses));

export const getMonthlyBudget = () => Number(localStorage.getItem("monthlyBudget") || 0);
export const saveMonthlyBudget = (amount: number) => localStorage.setItem("monthlyBudget", String(amount));

export const getTotal = (items: Array<{ monto: number }>) => items.reduce((sum, item) => sum + Number(item.monto || 0), 0);

export const formatCurrency = (amount: number) => `$${amount.toLocaleString("es-CL")}`;