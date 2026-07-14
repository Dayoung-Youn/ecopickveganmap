import { Leaf, Recycle, CheckSquare, Map } from 'lucide-react';
import { UI_COPY, categoryDisplayLabel, normalizeCategoryLabel, type Language } from '../lib/i18n';

/** Fixed filters below the map compass: 전체 + 3 categories */
export const FILTER_CATEGORY_KEYS = ['완전비건', '비건옵션', '제로웨이스트'] as const;

const BUTTON_BASE =
  'flex w-full min-w-[9.5rem] items-center gap-2 rounded-xl border border-cream-200/90 bg-white/95 px-2.5 py-2 text-left text-[11px] font-semibold shadow-md backdrop-blur-sm transition-all duration-200 sm:min-w-[10.5rem] sm:px-3 sm:py-2.5 sm:text-xs sm:font-medium';

const BUTTON_COMPACT =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cream-200/90 bg-white/95 p-0 shadow-md backdrop-blur-sm transition-all duration-200 sm:h-auto sm:w-full sm:min-w-[10.5rem] sm:gap-2 sm:px-3 sm:py-2.5 sm:text-left sm:text-xs sm:font-medium';

const CATEGORY_ACTIVE_COLORS: Record<string, string> = {
  전체: '#616e45',
  완전비건: '#5a6a42',
  비건옵션: '#9fb88a',
  제로웨이스트: '#BDCEBE',
};

function normCatLabel(s: string): string {
  return normalizeCategoryLabel(s);
}

function categoryChipClasses(cat: string, isHighlighted: boolean): string {
  const n = normCatLabel(cat);
  if (n === '완전비건') {
    return isHighlighted
      ? 'text-white shadow-md'
      : 'text-olive-900 hover:border-olive-300 hover:bg-olive-100';
  }
  if (n === '비건옵션') {
    return isHighlighted
      ? 'text-white shadow-md'
      : 'text-olive-700 hover:border-olive-300 hover:bg-olive-50';
  }
  if (n === '제로웨이스트') {
    return isHighlighted
      ? 'text-white shadow-md'
      : 'text-charcoal-700 hover:border-olive-300 hover:bg-cream-100';
  }
  return isHighlighted
    ? 'text-white shadow-md'
    : 'text-charcoal-700 hover:border-olive-300 hover:bg-cream-100';
}

function activeColorForCategory(cat: string | null): string {
  if (cat === null) return CATEGORY_ACTIVE_COLORS['전체'];
  const normalized = normCatLabel(cat);
  return CATEGORY_ACTIVE_COLORS[normalized] ?? CATEGORY_ACTIVE_COLORS['전체'];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  전체: <Map size={14} />,
  완전비건: <Leaf size={14} />,
  비건옵션: <CheckSquare size={14} />,
  제로웨이스트: <Recycle size={14} />,
};

function resolveCategoryLabel(categories: string[], key: string): string {
  const normalized = normalizeCategoryLabel(key);
  return categories.find((c) => normalizeCategoryLabel(c) === normalized) ?? key;
}

interface CategoryFilterProps {
  categories: string[];
  highlighted: string | null;
  language: Language;
  compact?: boolean;
  onSelect: (cat: string | null) => void;
}

export default function CategoryFilter({ categories, highlighted, language, compact = false, onSelect }: CategoryFilterProps) {
  const buttonClass = compact ? BUTTON_COMPACT : BUTTON_BASE;

  return (
    <div className={`pointer-events-auto flex flex-col ${compact ? 'gap-1.5 sm:gap-2' : 'gap-2'}`}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-label={UI_COPY[language].allSpots}
        className={`${buttonClass} ${
          highlighted === null
            ? 'text-white shadow-md'
            : 'text-charcoal-700 hover:border-olive-300 hover:bg-cream-100'
        }`}
        style={
          highlighted === null
            ? { backgroundColor: activeColorForCategory(null), borderColor: activeColorForCategory(null) }
            : undefined
        }
      >
        <span className="flex shrink-0 items-center justify-center [&>svg]:block">{CATEGORY_ICONS['전체']}</span>
        <span className={`min-w-0 truncate leading-snug ${compact ? 'sr-only sm:not-sr-only' : ''}`}>
          {UI_COPY[language].allSpots}
        </span>
      </button>
      {FILTER_CATEGORY_KEYS.map((key) => {
        const cat = resolveCategoryLabel(categories, key);
        const isHighlighted = highlighted !== null && normCatLabel(highlighted) === normCatLabel(cat);
        return (
          <button
            type="button"
            key={key}
            aria-label={categoryDisplayLabel(cat, language)}
            onClick={() => onSelect(isHighlighted ? null : cat)}
            className={`${buttonClass} ${categoryChipClasses(cat, isHighlighted)}`}
            style={
              isHighlighted
                ? { backgroundColor: activeColorForCategory(cat), borderColor: activeColorForCategory(cat) }
                : undefined
            }
          >
            <span className="flex shrink-0 items-center justify-center [&>svg]:block">
              {CATEGORY_ICONS[key] ?? <Leaf size={14} />}
            </span>
            <span className={`min-w-0 truncate leading-snug ${compact ? 'sr-only sm:not-sr-only' : ''}`}>
              {categoryDisplayLabel(cat, language)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function resolveHighlightedCategory(
  categories: string[],
  selectedPlaceCategory: string | null | undefined,
  activeCategory: string | null,
): string | null {
  if (selectedPlaceCategory) {
    for (const key of FILTER_CATEGORY_KEYS) {
      if (normCatLabel(selectedPlaceCategory) === normCatLabel(key)) {
        return resolveCategoryLabel(categories, key);
      }
    }
  }
  return activeCategory;
}
