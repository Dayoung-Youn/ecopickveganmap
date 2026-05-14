import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { ChevronLeft, ChevronRight, Compass, Globe2 } from 'lucide-react';
import CategoryFilter from './components/CategoryFilter';
import PlacePopup from './components/PlacePopup';
import { fetchPlaces } from './lib/fetchPlaces';
import { LANGUAGES, UI_COPY, type Language } from './lib/i18n';
import type { Place } from './lib/types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DRAWER_WIDTH_PX = 208; // matches Tailwind sm:w-52
const MOBILE_BREAKPOINT_PX = 640; // Tailwind sm breakpoint

/** 한반도 전체 뷰 (전체 버튼·초기 카메라 고정; 마커로 계산하지 않음) */
const KOREA_PENINSULA_BOUNDS = new mapboxgl.LngLatBounds([124.0, 33.0], [132.0, 43.0]);

/** 사용자가 지도를 벗어나지 못하게 하는 허용 범위 */
const MAP_MAX_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [123.0, 32.0],
  [133.0, 44.0],
];

const CATEGORY_COLORS: Record<string, string> = {
  비건: '#7c8c5a',
  완전비건: '#5a6a42',
  비건옵션: '#9fb88a',
  제로웨이스트: '#a3b18a',
  카페: '#c9a96e',
  식당: '#d4a373',
  샵: '#b5838d',
  스토어: '#6d6875',
};

/** Sheet labels may use spaces (e.g. "비건 옵션"); normalize for match + colors */
function normalizeCategoryLabel(s: string): string {
  return s.trim().replace(/\s+/g, '');
}

function categoryMatches(placeCategory: string, active: string): boolean {
  return normalizeCategoryLabel(placeCategory) === normalizeCategoryLabel(active);
}

function colorForCategory(raw: string): string {
  const n = normalizeCategoryLabel(raw);
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (normalizeCategoryLabel(key) === n) return val;
  }
  return '#7c8c5a';
}

/** After camera settles from fitBounds, resize so HTML markers match lng/lat pixels */
function fitBoundsThenResizeWhenStill(
  mapInstance: mapboxgl.Map,
  bounds: mapboxgl.LngLatBoundsLike,
  options: mapboxgl.FitBoundsOptions = {}, // 👈 1. 아무 값도 안 들어오면 빈 객체({})를 쓰도록 기본값을 줍니다.
): void {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    mapInstance.off('moveend', onMoveEnd);
    mapInstance.resize();
    requestAnimationFrame(() => mapInstance.resize());
  };
  const onMoveEnd = () => finish();
  mapInstance.on('moveend', onMoveEnd);
  mapInstance.fitBounds(bounds, options);
  
  // 👈 2. options.duration 앞에 물음표(?)를 붙여서 안전하게 확인합니다 (옵셔널 체이닝).
  const ms = typeof options?.duration === 'number' ? options.duration : 0; 
  window.setTimeout(finish, ms + 150);
}


export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const initialFitBoundsDoneRef = useRef(false);

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [language, setLanguage] = useState<Language>('en');

  const fitPadding = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT_PX) {
      return {
        top: drawerOpen ? 176 : 88,
        right: 48,
        bottom: 64,
        left: 64,
      };
    }

    const left = 80 + (drawerOpen ? DRAWER_WIDTH_PX : 0);
    return { top: 80, right: 80, bottom: 80, left };
  }, [drawerOpen]);

  const focusPlaceOnMap = useCallback(
    (place: Place) => {
      const m = map.current;
      if (!m) return;

      const isMobile = window.innerWidth < MOBILE_BREAKPOINT_PX;
      const targetZoom = isMobile ? 11.4 : 12.2;
      const currentZoom = m.getZoom();
      const offset: [number, number] = isMobile
        ? [0, -Math.min(window.innerHeight * 0.22, 190)]
        : [drawerOpen ? 260 : 210, 0];

      m.flyTo({
        center: [place.lng, place.lat],
        zoom: currentZoom > targetZoom ? targetZoom : Math.max(currentZoom, targetZoom),
        offset,
        speed: 1.1,
        curve: 1.25,
        essential: true,
      });
    },
    [drawerOpen],
  );

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [128, 38],
      zoom: 6.2,
      maxBounds: MAP_MAX_BOUNDS,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  // Mapbox must recalc canvas/HTML marker projection when the drawer slides (map width changes)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const id = window.setTimeout(() => {
      m.resize();
      requestAnimationFrame(() => m.resize());
    }, 320);
    return () => window.clearTimeout(id);
  }, [drawerOpen]);

  // Fetch places — fetchPlaces / Papa 로직은 lib/fetchPlaces.ts 에 그대로 둠
  useEffect(() => {
    fetchPlaces()
      .then((data) => {
        setPlaces(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setPlaces([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 초기 1회: 장소 개수와 무관하게 한반도 고정 영역만 표시 (서울 단일 줌 제거)
  useEffect(() => {
    if (loading || initialFitBoundsDoneRef.current) return;

    const runFit = () => {
      const m = map.current;
      if (!m?.isStyleLoaded()) return;
      fitBoundsThenResizeWhenStill(m, KOREA_PENINSULA_BOUNDS, {
        padding: fitPadding(),
        duration: 1000,
        maxZoom: 8,
      });
      initialFitBoundsDoneRef.current = true;
    };

    const m = map.current;
    if (!m) return;

    if (m.isStyleLoaded()) {
      runFit();
      return;
    }

    m.once('load', runFit);
    return () => {
      m.off('load', runFit);
    };
  }, [loading, fitPadding]);

  // When a category is selected, fit map to those markers (완전비건, 비건옵션, etc.)
  useEffect(() => {
    if (!activeCategory || loading) return;

    const m = map.current;
    if (!m) return;

    const subset = places.filter((p) => categoryMatches(p.category, activeCategory));
    const valid = subset.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (valid.length === 0) return;

    const runFit = () => {
      if (!map.current?.isStyleLoaded()) return;
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach((p) => bounds.extend([p.lng, p.lat]));
      if (!bounds.isEmpty()) {
        fitBoundsThenResizeWhenStill(map.current, bounds, {
          padding: fitPadding(),
          duration: 1000,
          maxZoom: 16,
        });
      }
    };

    if (m.isStyleLoaded()) {
      runFit();
      return;
    }

    m.once('load', runFit);
    return () => {
      m.off('load', runFit);
    };
  }, [activeCategory, places, loading, fitPadding]);

  const categories = useMemo(() => {
    const labels = places.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c));
    return [...new Set(labels)].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [places]);

  const filtered = useMemo(
    () =>
      activeCategory
        ? places.filter((p) => categoryMatches(p.category, activeCategory))
        : places,
    [places, activeCategory],
  );

  const relatedPlaces = useMemo(() => {
    if (!selectedPlace || !selectedPlace.postUrl) return [];

    const getPostId = (url: string) => {
      const str = String(url).trim();
      if (!str.includes('/p/')) return str; // 일반 링크면 전체 주소 사용
      return str.split('/p/')[1].split(/[/?]/)[0];
    };

    const targetId = getPostId(selectedPlace.postUrl);
    if (!targetId) return [];

    return places.filter((p) => {
      if (!p.postUrl) return false;
      
      const compareId = getPostId(p.postUrl);
      
      return compareId === targetId && p.name !== selectedPlace.name;
    });
  }, [places, selectedPlace]);
  
  const handleCategorySelect = useCallback(
    (cat: string | null) => {
      setActiveCategory(cat);
      if (cat !== null) return;

      const m = map.current;
      if (!m?.isStyleLoaded()) return;

      requestAnimationFrame(() => {
        if (!map.current?.isStyleLoaded()) return;
        fitBoundsThenResizeWhenStill(map.current, KOREA_PENINSULA_BOUNDS, {
          padding: fitPadding(),
          duration: 1000,
          maxZoom: 8,
        });
      });
    },
    [fitPadding],
  );

  // Create markers — unique keys so duplicate names do not leave orphan DOM markers
  useEffect(() => {
    if (!map.current) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filtered.forEach((place, index) => {
      const color = colorForCategory(place.category);
      const isSelected = selectedPlace?.name === place.name;
      /** Mapbox positions this node only — no custom transform/size on it (see App.css) */
      const root = document.createElement('div');
      root.className =
        isSelected
          ? 'mapbox-marker-root mapbox-marker-root--selected'
          : 'mapbox-marker-root';

      const inner = document.createElement('div');
      inner.className = 'custom-teardrop-marker';
      inner.style.backgroundColor = isSelected ? '#f7f5ee' : color;

      const hole = document.createElement('div');
      hole.className = 'custom-teardrop-marker__hole';
      inner.appendChild(hole);
      root.appendChild(inner);

      inner.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPlace(place);
        focusPlaceOnMap(place);
      });

      const marker = new mapboxgl.Marker({ element: root, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(map.current!);

      const markerKey = `${place.postUrl}::${place.name}::${index}`;
      markersRef.current[markerKey] = marker;
    });
  }, [filtered, focusPlaceOnMap, selectedPlace]);

  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    focusPlaceOnMap(place);
  }, [focusPlaceOnMap]);

  return (
    <div className="relative w-full h-full bg-cream-50">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Category drawer + toggle */}
      <div className="pointer-events-none absolute left-3 top-3 z-50 h-0 w-0 sm:left-0 sm:top-0 sm:h-full">
        <div
          className={`pointer-events-auto absolute left-0 top-0 flex max-h-[calc(100vh-24px)] w-48 flex-col rounded-2xl border border-cream-200/80 bg-white/90 py-3 shadow-lg backdrop-blur-md transition-all duration-300 ease-out sm:h-full sm:max-h-none sm:w-52 sm:rounded-l-none sm:rounded-r-2xl ${
            drawerOpen
              ? 'translate-y-0 opacity-100 sm:translate-x-0'
              : 'pointer-events-none -translate-y-2 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:-translate-x-full sm:opacity-100'
          }`}
        >
          <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-olive-600">
              <Compass size={15} className="text-white" />
            </div>
            <span className="text-xs font-bold leading-snug tracking-tight text-charcoal-800">
              Veganmap @ecopick.mag
            </span>
          </div>
          <div className="mx-2 h-px shrink-0 bg-cream-200" />
          <div className="min-h-0 flex-1 overflow-hidden pt-2">
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              language={language}
              onSelect={handleCategorySelect}
            />
          </div>
          <div className="mx-2 mt-2 h-px shrink-0 bg-cream-200" />
          <div className="flex shrink-0 items-center gap-1 px-3 pt-2">
            <Globe2 size={14} className="shrink-0 text-olive-700" />
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  aria-label={`Set language to ${item.label}`}
                  aria-pressed={language === item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`h-7 min-w-0 flex-1 rounded-lg px-1 text-[10px] font-bold transition-colors ${
                    language === item.code
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'text-charcoal-600 hover:bg-cream-100'
                  }`}
                >
                  {item.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? UI_COPY[language].closeDrawer : UI_COPY[language].openDrawer}
          onClick={() => setDrawerOpen((o) => !o)}
          className={`pointer-events-auto absolute left-0 top-0 z-[11] hidden h-11 w-11 items-center justify-center rounded-xl border border-cream-200/90 bg-white/95 shadow-md backdrop-blur-sm transition-[left] duration-300 ease-out hover:bg-white sm:left-auto sm:top-1/2 sm:flex sm:h-24 sm:w-9 sm:-translate-y-1/2 sm:rounded-l-none sm:rounded-r-xl ${
            drawerOpen ? 'sm:left-52' : 'sm:left-0'
          }`}
        >
          {drawerOpen ? (
            <>
              <ChevronLeft size={20} className="hidden text-charcoal-600 sm:block" />
              <Compass size={18} className="text-olive-700 sm:hidden" />
            </>
          ) : (
            <>
              <ChevronRight size={20} className="hidden text-charcoal-600 sm:block" />
              <Compass size={18} className="text-olive-700 sm:hidden" />
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-olive-200 border-t-olive-600" />
            <p className="text-sm font-medium text-charcoal-600">{UI_COPY[language].loadingPlaces}</p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <PlacePopup
          place={selectedPlace}
          related={relatedPlaces}
          drawerOpen={drawerOpen}
          language={language}
          onClose={() => setSelectedPlace(null)}
          onPlaceClick={handlePlaceClick}
        />
      )}
    </div>
  );
}
