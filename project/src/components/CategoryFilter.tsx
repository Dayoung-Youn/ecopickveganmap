import { Leaf, Recycle, Coffee, Store, Utensils, ShoppingBag, Map } from 'lucide-react';
import { UI_COPY, categoryDisplayLabel, normalizeCategoryLabel, type Language } from '../lib/i18n';

/** Match sheet labels with optional spaces (e.g. "비건 옵션") */
function normCatLabel(s: string): string {
  return normalizeCategoryLabel(s);
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
  language: Language;
  onSelect: (cat: string | null) => void;
}

export default function CategoryFilter({ categories, active, language, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex w-full min-h-0 flex-col gap-1.5 overflow-y-auto px-1 py-1 scrollbar-hide">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold transition-all duration-200 shrink-0 sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:font-medium ${
          active === null
            ? 'bg-olive-600 text-white shadow-md'
            : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200'
        }`}
      >
        <Map size={13} className="shrink-0 sm:size-[14px]" />
        <span className="min-w-0 truncate whitespace-nowrap leading-snug">{UI_COPY[language].allSpots}</span>
      </button>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat}
          onClick={() => onSelect(cat === active ? null : cat)}
          className={`flex w-full min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold transition-all duration-200 shrink-0 sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:font-medium ${categoryChipClasses(cat, active === cat)}`}
        >
          <span className="shrink-0 flex items-center justify-center [&>svg]:block">
            {CATEGORY_ICONS[normCatLabel(cat)] ?? CATEGORY_ICONS[cat] ?? <Leaf size={14} />}
          </span>
          <span className="min-w-0 truncate whitespace-nowrap leading-snug">{categoryDisplayLabel(cat, language)}</span>
        </button>
      ))}
    </div>
  );
}
