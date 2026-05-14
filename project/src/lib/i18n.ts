export type Language = 'en' | 'zh' | 'ja' | 'es';

export const LANGUAGES: Array<{ code: Language; label: string; shortLabel: string }> = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'zh', label: '中文', shortLabel: '中文' },
  { code: 'ja', label: '日本語', shortLabel: '日本' },
  { code: 'es', label: 'Español', shortLabel: 'ES' },
];

type UiCopy = {
  allSpots: string;
  closeDrawer: string;
  loadingPlaces: string;
  noInstagram: string;
  openDrawer: string;
  relatedPlaces: string;
  viewInstagram: string;
};

export const UI_COPY: Record<Language, UiCopy> = {
  en: {
    allSpots: '전체 All Spots',
    closeDrawer: '카테고리 서랍 접기 Close categories',
    loadingPlaces: '장소를 불러오는 중... Loading places...',
    noInstagram: '인스타그램 리뷰 링크가 없습니다. No Instagram review link available.',
    openDrawer: '카테고리 서랍 펼치기 Open categories',
    relatedPlaces: '이 코스로 함께 소개된 장소들 Places featured in this route',
    viewInstagram: 'Instagram에서 자세히 보기 View on Instagram',
  },
  zh: {
    allSpots: '전체 所有地点',
    closeDrawer: '카테고리 서랍 접기 收起分类',
    loadingPlaces: '장소를 불러오는 중... 正在加载地点...',
    noInstagram: '인스타그램 리뷰 링크가 없습니다. 没有 Instagram 评论链接。',
    openDrawer: '카테고리 서랍 펼치기 展开分类',
    relatedPlaces: '이 코스로 함께 소개된 장소들 此路线一同介绍的地点',
    viewInstagram: 'Instagram에서 자세히 보기 在 Instagram 查看详情',
  },
  ja: {
    allSpots: '전체 すべてのスポット',
    closeDrawer: '카테고리 서랍 접기 カテゴリーを閉じる',
    loadingPlaces: '장소를 불러오는 중... スポットを読み込み中...',
    noInstagram: '인스타그램 리뷰 링크가 없습니다. Instagramレビューリンクはありません。',
    openDrawer: '카테고리 서랍 펼치기 カテゴリーを開く',
    relatedPlaces: '이 코스로 함께 소개된 장소들 このコースで紹介されたスポット',
    viewInstagram: 'Instagram에서 자세히 보기 Instagramで詳しく見る',
  },
  es: {
    allSpots: '전체 Todos los lugares',
    closeDrawer: '카테고리 서랍 접기 Cerrar categorías',
    loadingPlaces: '장소를 불러오는 중... Cargando lugares...',
    noInstagram: '인스타그램 리뷰 링크가 없습니다. No hay enlace de reseña en Instagram.',
    openDrawer: '카테고리 서랍 펼치기 Abrir categorías',
    relatedPlaces: '이 코스로 함께 소개된 장소들 Lugares incluidos en esta ruta',
    viewInstagram: 'Instagram에서 자세히 보기 Ver en Instagram',
  },
};

const CATEGORY_COPY: Record<string, Record<Language, string>> = {
  비건: {
    en: 'Vegan',
    zh: '纯素',
    ja: 'ヴィーガン',
    es: 'Vegano',
  },
  완전비건: {
    en: 'All Vegan',
    zh: '全纯素',
    ja: '完全ヴィーガン',
    es: '100% vegano',
  },
  비건옵션: {
    en: 'Vegan-option',
    zh: '有纯素选项',
    ja: 'ヴィーガン対応',
    es: 'Opción vegana',
  },
  제로웨이스트: {
    en: 'Zero Waste',
    zh: '零废弃',
    ja: 'ゼロウェイスト',
    es: 'Cero residuos',
  },
  카페: {
    en: 'Cafe',
    zh: '咖啡馆',
    ja: 'カフェ',
    es: 'Café',
  },
  식당: {
    en: 'Restaurant',
    zh: '餐厅',
    ja: 'レストラン',
    es: 'Restaurante',
  },
  샵: {
    en: 'Shop',
    zh: '商店',
    ja: 'ショップ',
    es: 'Tienda',
  },
  스토어: {
    en: 'Store',
    zh: '商店',
    ja: 'ストア',
    es: 'Tienda',
  },
};

export function normalizeCategoryLabel(s: string): string {
  return s.trim().replace(/\s+/g, '');
}

export function categoryDisplayLabel(cat: string, language: Language): string {
  const normalized = normalizeCategoryLabel(cat);
  const translated = CATEGORY_COPY[normalized]?.[language];
  return translated ? `${cat} ${translated}` : cat;
}
