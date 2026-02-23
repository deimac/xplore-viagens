import { Briefcase, Plane, Hotel } from "lucide-react";

interface Categoria {
  id: number;
  nome: string;
}

interface CategoryFilterProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  categories: Categoria[];
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {/* All button */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedCategory === null
            ? "bg-accent text-accent-foreground shadow-lg"
            : "bg-muted text-foreground hover:bg-muted/80"
          }`}
      >
        Todos
      </button>

      {/* Category buttons */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedCategory === cat.id
              ? "bg-accent text-accent-foreground shadow-lg"
              : "bg-muted text-foreground hover:bg-muted/80"
            }`}
        >
          {cat.nome}
        </button>
      ))}
    </div>
  );
}
