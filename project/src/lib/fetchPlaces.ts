import Papa from 'papaparse';
import type { Place, CsvRow } from './types';

function parseCoordinate(value: string | undefined): number {
  if (value == null || value === '') return NaN;
  const normalized = String(value).trim().replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOiijwtuQ-wqXjoEu63BgLnXwnB8bTMjEgXc-z83WU51B1tUBSgILqJ2YZ0KhbEN0lNfbIWDWDzmjc/pub?output=csv';

export async function fetchPlaces(): Promise<Place[]> {
  const response = await fetch(CSV_URL);
  const text = await response.text();

  const { data } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return data
    .map((row) => ({
      postUrl: row['게시물 URL (Key)'] ?? '',
      name: row['장소명'] ?? '',
      address: row['주소'] ?? '',
      lat: parseCoordinate(row['위도']),
      lng: parseCoordinate(row['경도']),
      category: row['카테고리'] ?? '',
      imageUrl: row['이미지 URL'] ?? '',
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0);
}
