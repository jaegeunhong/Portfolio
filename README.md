# Jae Geun Hong — Portfolio

GitHub Pages로 배포되는 정적 포트폴리오 사이트 (빌드 도구 없음, HTML/CSS/JS만 사용).

라이브: https://jaegeunhong.github.io/Portfolio/

## 폴더 구조
```
index.html              — 페이지 전체 내용 (섹션별로 주석 구분)
assets/
  css/style.css         — 디자인 (색상·폰트는 맨 위 :root 변수에서 한 번에 변경)
  js/main.js            — 스크롤 애니메이션, 네비게이션, 라이트박스, SpinLaunch 원리 애니메이션
  js/model-viewer.js    — 3D CAD 뷰어 (three.js, 화면에 가까워질 때만 로드)
  img/                  — 사진 + 영상 썸네일
  video/                — mp4 영상
  model/assembly.stl    — SpinLaunch 3D 모델
```

## 페이지 구성
1. **Hero** (`#home`) — 이름, 한 줄 소개, 프로필 사진
2. **About** (`#about`) — 소개 문장, 전공/툴킷/현재 관심사, 3가지 포커스 카드
3. **Selected work** (`#work`) — 프로젝트 카드 2개 (클릭하면 해당 케이스 스터디로 이동)
4. **SpinLaunch** (`#spinlaunch`) — 수치, 동기/역할, 작동 원리 애니메이션, 궤적 차트, 3D 모델, 테스트 영상
5. **VEX Robotics** (`#vex`) — 수치, 역할, 조립 사진, 자율주행 영상
6. **Arduino RC Car** (`#arduino-car`) — 개인 프로젝트(Ongoing): CAD 뷰 5장, 스펙 시트, 진행 상황, 센서 스캔 애니메이션, 엔지니어링 노트
7. **Contact** (`#contact`) — 이메일(복사 버튼), LinkedIn

## 자주 할 수정
- **텍스트 수정**: `index.html`에서 해당 문장을 찾아 바로 고치면 됨
- **포인트 색상 변경**: `assets/css/style.css` 맨 위 `--accent` 값 변경
- **숫자(통계) 수정**: `<span data-count="15">15</span>`처럼 `data-count`와 안의 숫자를 같이 바꾸기
- **영상 추가**: `.log-grid` 안의 `<figure class="clip-card">` 블록 하나를 복사해서 `data-src`, `poster`, `<source>` 경로와 설명만 바꾸기
- **Arduino 카 진행 상황 변경**: `#arduino-car` 안의 `.progress-steps`에서 `is-done` / `is-current` 클래스와 `Done` / `In progress` / `Next` 표시를 옮기면 됨. 완성되면 `Ongoing` 배지(`<span class="status">`) 두 곳을 지우거나 문구를 바꾸기
- **프로젝트 추가**: `<article class="case" id="...">` 블록을 통째로 복사 → 내용 교체, 그리고 `#work` 섹션에 `work-card` 하나, 상단 `nav`에 링크 하나 추가

## 배포
`main` 브랜치에 push하면 GitHub Pages가 1~2분 안에 자동으로 반영함 (Settings → Pages → Deploy from a branch → `main` / root).

## 참고
- 휴대폰 번호는 공개 사이트 특성상 일부러 뺐음
- 애니메이션은 OS의 "동작 줄이기(Reduce motion)" 설정을 켜면 자동으로 꺼짐
