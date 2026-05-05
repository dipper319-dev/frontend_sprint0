import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Category, getCategories, saveCategories } from "@/lib/finance";

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const persist = (next: Category[]) => {
    setCategories(next);
    saveCategories(next);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("No estás autenticado");
        return;
      }

      // ✨ Guardar en el backend
      const response = await fetch("http://localhost:8080/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: cleanName,
          descripcion: "",
          color: "#000000",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || "Error al crear categoría");
      }

      const data = await response.json();
      
      // Agregar a la lista local
      const newCategory = { id: String(data.data.id), name: cleanName };
      persist([...categories, newCategory]);
      setName("");
      toast.success("Categoría agregada");

    } catch (err: any) {
      toast.error(err.message);
      console.error("Error:", err);
    }
  };

  const saveEdit = (id: string) => {
    const cleanName = editingName.trim();
    if (!cleanName) return;
    persist(categories.map((category) => category.id === id ? { ...category, name: cleanName } : category));
    setEditingId(null);
    toast.success("Categoría actualizada");
  };

  const deleteCategory = (id: string) => {
    persist(categories.filter((category) => category.id !== id));
    toast.success("Categoría eliminada");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center shadow-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={22} /></Button>
        <span className="text-base font-semibold text-foreground ml-2">Categorías</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 max-w-lg mx-auto w-full">
        <Logo size="sm" showText={false} />
        <h1 className="text-xl font-bold text-foreground mt-5 mb-8">Gestionar categorías</h1>

        <form onSubmit={addCategory} className="w-full flex gap-2 mb-5">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" maxLength={40} />
          <Button type="submit" size="icon" className="gradient-hero text-primary-foreground"><Plus size={20} /></Button>
        </form>

        <div className="w-full space-y-3">
          {categories.map((category) => (
            <Card key={category.id} className="shadow-card">
              <CardContent className="p-3 flex items-center gap-2">
                {editingId === category.id ? (
                  <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} maxLength={40} className="flex-1" />
                ) : (
                  <span className="flex-1 text-sm font-medium text-foreground">{category.name}</span>
                )}
                {editingId === category.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => saveEdit(category.id)}><Check size={18} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X size={18} /></Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(category.id); setEditingName(category.name); }}><Pencil size={18} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}><Trash2 size={18} className="text-destructive" /></Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}