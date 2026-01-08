import { Briefcase, Plane, Hotel } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
}

interface CategoryFilterProps {
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  categories: Category[];
}

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  Pacotes: <Briefcase className="w-5 h-5" />,
  Passagens: <Plane className="w-5 h-5" />,
  Hospedagens: <Hotel className="w-5 h-5" />,
};

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
        className={`px-6 py-2 rounded-lg font-medium transition-all ${
          selectedCategory === null
            ? "bg-accent text-accent-foreground shadow-lg"
            : "bg-muted text-foreground hover:bg-muted/80"
        }`}
      >
        Todos
      </button>

      {/* Category buttons */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            selectedCategory === category.id
              ? "bg-accent text-accent-foreground shadow-lg"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          {DEFAULT_ICONS[category.name] || null}
          {category.name}
        </button>
      ))}
    </div>
  );
}
