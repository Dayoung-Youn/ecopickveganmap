import { X, MapPin, ExternalLink, Lightbulb } from 'lucide-react';
import { UI_COPY, categoryDisplayLabel, type Language } from '../lib/i18n';
import type { Place } from '../lib/types';

interface PlacePopupProps {
  place: Place;
  related: Place[];
  drawerOpen?: boolean;
  language: Language;
  onClose: () => void;
  onPlaceClick: (place: Place) => void;
}

export default function PlacePopup({
  place,
  related,
  drawerOpen = true,
  language,
  onClose,
  onPlaceClick,
}: PlacePopupProps) {
  const others = related.filter((p) => p.name !== place.name);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-40 w-full bg-cream-50 shadow-2xl flex flex-col rounded-t-3xl max-h-[70vh] animate-slide-up overflow-hidden sm:bottom-auto sm:top-0 sm:w-96 sm:rounded-none sm:rounded-r-3xl sm:max-h-screen sm:animate-slide-in ${
        drawerOpen ? 'sm:left-52' : 'sm:left-3'
      }`}
    >
      {/* Header image */}
      <div className="relative h-48 bg-olive-700 overflow-hidden flex-shrink-0">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-olive-100">
            <MapPin size={40} className="text-olive-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-charcoal-700 hover:bg-white transition-colors"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-3 left-4">
          <span className="inline-block rounded-full bg-olive-600/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
            {categoryDisplayLabel(place.category, language)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Place info */}
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">{place.name}</h2>
          <p className="mt-2 text-sm text-charcoal-600 flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-olive-500" />
            {place.address}
          </p>
        </div>

        {/* Related places */}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-charcoal-800">{UI_COPY[language].relatedPlaces}</h3>
            </div>
            <div className="space-y-2">
              {others.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onPlaceClick(p)}
                  className="w-full text-left rounded-xl bg-white border border-cream-200 p-3 hover:border-olive-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-olive-50 flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-olive-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal-800 truncate">{p.name}</p>
                      <p className="text-xs text-charcoal-500 truncate">
                        {categoryDisplayLabel(p.category, language)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instagram CTA */}
      <div className="px-5 py-4 border-t border-cream-200 flex-shrink-0 bg-cream-50">
        {place.postUrl ? (
          // 인스타그램 링크가 있는 경우에만 버튼 표시
          <a
            href={String(place.postUrl).startsWith('http') ? String(place.postUrl) : `https://${place.postUrl}`}
            target="_blank" // 새 탭에서 열기
            rel="noopener noreferrer" // 보안 및 성능용
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-olive-600 to-olive-700 px-4 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:from-olive-700 hover:to-olive-800 transition-all duration-200"
          >
            <ExternalLink size={16} />
            {UI_COPY[language].viewInstagram}
          </a>
        ) : (
          // 링크가 없는 경우 플레이스홀더 또는 버튼 숨김 처리
          <div className="text-center text-sm text-charcoal-500 py-2 border border-dashed border-cream-300 rounded-xl bg-white">
            {UI_COPY[language].noInstagram}
          </div>
        )}
      </div>
    </div>
  );
}
