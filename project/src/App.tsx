import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import CategoryFilter from './components/CategoryFilter';
import PlacePopup from './components/PlacePopup';
import { fetchPlaces } from './lib/fetchPlaces';
import type { Place } from './lib/types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DRAWER_WIDTH_PX = 208; // matches Tailwind w-52

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

  const fitPadding = useCallback(() => {
    const left = 80 + (drawerOpen ? DRAWER_WIDTH_PX : 0);
    return { top: 80, right: 80, bottom: 80, left };
  }, [drawerOpen]);

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
    // 1. 선택된 장소나 인스타 링크가 아예 없으면 빈 목록 반환
    if (!selectedPlace || !selectedPlace.postUrl) return [];
    
    // 2. 링크 주소를 깨끗하게 정리 (양끝 공백 제거)
    const targetUrl = String(selectedPlace.postUrl).trim();
    
    // 3. 링크가 너무 짧거나 유효하지 않으면 리스트를 안 보여줌 (빈칸 매칭 방지)
    if (targetUrl.length < 10) return [];

    return places.filter((p) => {
      if (!p.postUrl) return false;
      
      const compareUrl = String(p.postUrl).trim();
      
      // 4. 링크가 정확히 일치하고, '나 자신'이 아닌 다른 장소들만 모으기
      // (만약 이름이 같아도 리스트에 나오길 원하시면 && 뒤를 지우시면 됩니다)
      return compareUrl === targetUrl && p.name !== selectedPlace.name;
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
      /** Mapbox positions this node only — no custom transform/size on it (see App.css) */
      const root = document.createElement('div');
      root.className =
        selectedPlace?.name === place.name
          ? 'mapbox-marker-root mapbox-marker-root--selected'
          : 'mapbox-marker-root';

      const inner = document.createElement('div');
      inner.className = 'custom-teardrop-marker';
      inner.style.backgroundColor = color;

      const hole = document.createElement('div');
      hole.className = 'custom-teardrop-marker__hole';
      inner.appendChild(hole);
      root.appendChild(inner);

      inner.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPlace(place);
      });

      const marker = new mapboxgl.Marker({ element: root, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(map.current!);

      const markerKey = `${place.postUrl}::${place.name}::${index}`;
      markersRef.current[markerKey] = marker;
    });
  }, [filtered, selectedPlace]);

  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    if (map.current) {
      map.current.flyTo({ center: [place.lng, place.lat], zoom: 13, speed: 1.2 });
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-cream-50">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Slide drawer + toggle tab */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-0">
        <div
          className={`pointer-events-auto absolute left-0 top-0 flex h-full w-52 flex-col rounded-r-2xl border border-cream-200/80 bg-white/90 py-3 shadow-lg backdrop-blur-md transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
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
              onSelect={handleCategorySelect}
            />
          </div>
        </div>

        <button
          type="button"
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? '카테고리 서랍 접기' : '카테고리 서랍 펼치기'}
          onClick={() => setDrawerOpen((o) => !o)}
          className={`pointer-events-auto absolute top-1/2 z-[11] flex h-24 w-9 -translate-y-1/2 items-center justify-center rounded-r-xl border border-cream-200/90 bg-white/95 shadow-md backdrop-blur-sm transition-[left] duration-300 ease-out hover:bg-white ${
            drawerOpen ? 'left-52' : 'left-0'
          }`}
        >
          {drawerOpen ? (
            <ChevronLeft size={20} className="text-charcoal-600" />
          ) : (
            <ChevronRight size={20} className="text-charcoal-600" />
          )}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-olive-200 border-t-olive-600" />
            <p className="text-sm font-medium text-charcoal-600">장소를 불러오는 중...</p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <PlacePopup
          place={selectedPlace}
          related={relatedPlaces}
          drawerOpen={drawerOpen}
          onClose={() => setSelectedPlace(null)}
          onPlaceClick={handlePlaceClick}
        />
      )}
    </div>
  );
}
