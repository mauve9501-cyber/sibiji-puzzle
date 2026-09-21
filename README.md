# 십이지 그림 조각 퍼즐 · 십장생플러스

열두 띠 그림을 오방색으로 재채색하고, 그림을 이루는 형태 그대로 조각으로 나눈 **드래그·스냅 퍼즐**입니다. 조각을 맞추며 십장생플러스의 전통 이야기에 머물고, 완성 후 인스타그램 팔로우로 이어지도록 설계했습니다.

**라이브:** Vercel 배포 URL
**인스타그램:** [@tenlongevityplus](https://www.instagram.com/tenlongevityplus/)

## 기능
- 12지신 전체 + 3단계 난이도(쉬움/보통/어려움 — 힌트·스냅 허용오차만 변화)
- 마우스·터치 드래그, 반응형(데스크톱 2열 / 모바일 스택), 라이트·다크 배경
- 조형 정보 패널(방위·오행·오방색·상징·아이 눈높이 해설)
- 십장생플러스 브랜드 바 + 완성 모달·하단 밴드의 **인스타 팔로우 CTA**
- Supabase 실시간 완성 카운팅(미설정 시 localStorage 자동 폴백)

## 구조
```
index.html            배포 대상(단일 파일: 퍼즐 + 브랜드 + 카운팅)
puzzle-source.html    퍼즐 원본(아티팩트 export) — 빌드 입력
build.js              원본에 브랜드·인스타·카운팅을 주입해 index.html 생성
supabase-config.json  Supabase URL + publishable(anon) 키
schema.sql            카운팅 테이블·RPC(Supabase SQL Editor에서 실행)
vercel.json           정적 배포 설정
```

## 업데이트 후 재배포
퍼즐(동물)이 갱신되면:
1. 새 아티팩트 HTML로 `puzzle-source.html` 을 교체.
2. `node build.js` 실행 → `index.html` 재생성(브랜드·카운팅 자동 반영).
3. 바뀐 `index.html` 을 GitHub에 다시 업로드하면 Vercel이 자동 재배포.

## Supabase 카운팅
`schema.sql` 을 SQL Editor에서 실행하면 `puzzle_plays` 테이블과 `record_play` /
`get_play_count` RPC가 생성됩니다. 클라이언트는 publishable 키로 이 RPC만 호출하며,
테이블은 RLS로 직접 접근이 차단됩니다. 완성 시마다 1건이 기록되고 총합이 화면에 표시됩니다.

## 로컬 실행
```bash
npx serve .
```

© 십장생플러스 (d·mauve)
