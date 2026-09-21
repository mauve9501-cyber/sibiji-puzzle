# 십이지 도형 퍼즐 · 십장생플러스

띠 그림을 이루는 **벡터 도형 하나하나가 조각**인 드래그·스냅 퍼즐입니다. 조각을 맞추며 십장생플러스의 전통 이야기에 머물고, 완성 후 인스타그램 팔로우로 이어지도록 설계했습니다. 확대해도 깨지지 않습니다.

**라이브:** https://sibiji-puzzle.vercel.app
**인스타그램:** [@tenlongevityplus](https://www.instagram.com/tenlongevityplus/)

## 기능
- 3단계 난이도(쉬움/보통/어려움 — 힌트·스냅 허용오차만 변화), 전통 백색/컬러 토글, 라이트·다크 배경
- 마우스·터치 드래그, 반응형(데스크톱 2열 / 모바일 스택)
- 조형 정보 패널(방위·오행·오방색·상징·아이 눈높이 해설)
- 십장생플러스 브랜드 바 + 완성 모달·하단 밴드의 **인스타 팔로우 CTA**
- Supabase 실시간 완성 카운팅(미설정 시 localStorage 자동 폴백)

**현재 준비된 띠:** 닭·개·돼지 (나머지 9마리는 SVG가 준비되는 대로 추가)

## 구조
```
index.html            배포 대상(단일 파일: 퍼즐 + 브랜드 + 카운팅)
puzzle-source.html    벡터 퍼즐 엔진 원본 — 빌드 입력
rooster.svg pig.svg dog.svg   동물 아트워크(Illustrator SVG)
build.js              SVG를 파싱해 동물 shapes로 주입 + 브랜드·인스타·카운팅 주입 → index.html
supabase-config.json  Supabase URL + publishable(anon) 키
schema.sql            카운팅 테이블·RPC(Supabase SQL Editor에서 실행)
vercel.json           정적 배포 설정
```

## 동물 추가/교체 후 재배포
1. 새 동물 SVG를 루트에 `<key>.svg`로 넣고, `build.js`의 `SVG_MAP`에 `key: "<key>.svg"` 등록.
   (key: rat·ox·tiger·rabbit·dragon·snake·horse·sheep·monkey·rooster·dog·pig)
2. `node build.js` → `index.html` 재생성(도형·브랜드·카운팅 자동 반영).
3. 바뀐 파일을 GitHub에 업로드하면 Vercel이 자동 재배포.

SVG는 Illustrator export 형식(`<path>`/`<circle>`/`<polygon>`/`<rect>` + `<style>`)을 그대로 받으며, `fill:none`(장식 stroke)은 제외하고 문서 순서대로 조각화합니다.

## Supabase 카운팅
`schema.sql`을 SQL Editor에서 실행하면 `puzzle_plays` 테이블과 `record_play` / `get_play_count` RPC가 생깁니다. 클라이언트는 publishable 키로 이 RPC만 호출하고, 테이블은 RLS로 직접 접근이 차단됩니다. 완성 시마다 1건 기록·총합 표시.

## 로컬 실행
```bash
npx serve .
```

© 십장생플러스 (d·mauve)
