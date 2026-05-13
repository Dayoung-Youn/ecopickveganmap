export interface Place {
  postUrl: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  imageUrl: string;
}

export interface CsvRow {
  '게시물 URL (Key)': string;
  '장소명': string;
  '주소': string;
  '위도': string;
  '경도': string;
  '카테고리': string;
  '이미지 URL': string;
}
