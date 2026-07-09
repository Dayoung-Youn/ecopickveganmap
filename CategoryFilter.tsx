import { Leaf, Recycle, Coffee, Store, Utensils, ShoppingBag, Map } from 'lucide-react';

/** Match sheet labels with optional spaces (e.g. "비건 옵션") */
function normCatLabel(s: string): string {
  return s.trim().replace(/\s+/g, '');
}

/** Drawer 표시용 (필터 값은 시트의 cat 그대로 유지) */
export function categoryDisplayLabel(cat: string): string {
  const n = normCatLabel(cat);
  if (n === '완전비건') return '완전비건 All Vegan';
  if (n === '비건옵션') return '비건옵션 Vegan-option';
  return cat;
}

function categoryChipClasses(cat: string, isActive: boolean): string {
  const n = normCatLabel(cat);
  if (n === '완전비건') {
    return isActive
      ? 'bg-olive-600 text-white shadow-md'
      : 'bg-olive-200 text-olive-900 hover:bg-olive-300';
  }
  if (n === '비건옵션') {
    return isActive
      ? 'bg-olive-400 text-white shadow-md'
      : 'bg-olive-50 text-olive-700 border border-olive-200/70 hover:bg-olive-100';
  }
  return isActive
    ? 'bg-olive-600 text-white shadow-md'
    : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200';
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  비건: <Leaf size={14} />,
  완전비건: <Leaf size={14} />,
  비건옵션: <Leaf size={14} />,
  제로웨이스트: <Recycle size={14} />,
  카페: <Coffee size={14} />,
  식당: <Utensils size={14} />,
  샵: <ShoppingBag size={14} />,
  스토어: <Store size={14} />,
};

interface CategoryFilterProps {
  categories: string[];
  active: string | null;
  onSelect: (cat: string | null) => void;
}

export default function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-2 w-full min-h-0 px-1 py-1 scrollbar-hide overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 shrink-0 ${
          active === null
            ? 'bg-olive-600 text-white shadow-md'
            : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200'
        }`}
      >
        <Map size={14} className="shrink-0" />
        <span className="leading-snug">전체 All Spots</span>
      </button>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat}
          onClick={() => onSelect(cat === active ? null : cat)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 shrink-0 ${categoryChipClasses(cat, active === cat)}`}
        >
          <span className="shrink-0 flex items-center justify-center [&>svg]:block">
            {CATEGORY_ICONS[normCatLabel(cat)] ?? CATEGORY_ICONS[cat] ?? <Leaf size={14} />}
          </span>
          <span className="leading-snug break-keep">{categoryDisplayLabel(cat)}</span>
        </button>
      ))}
    </div>
  );
}
