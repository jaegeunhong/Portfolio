# Jae Geun Hong — Portfolio

GitHub Pages로 배포되는 정적 포트폴리오 사이트 (빌드 도구 없음, HTML/CSS/JS만 사용).

라이브: https://jaegeunhong.github.io/Portfolio/

## 폴더 구조
```
index.html              — 페이지 전체 내용 (섹션별로 주석 구분)
assets/
  css/style.css         — 디자인 (색상·폰트는 맨 위 :root 변수에서 한 번에 변경)
  js/main.js            — 스크롤 애니메이션, 네비게이션(←/→ 키), 라이트박스, 이미지 자리표시, SpinLaunch 원리 애니메이션
  js/model-viewer.js    — 3D 뷰어 (three.js, 화면에 가까워질 때만 로드 / .glb·.stl 모두 지원, 여러 개 가능)
  img/                  — 사진 + 영상 썸네일
  video/                — mp4 영상
  model/spinlaunch.glb  — SpinLaunch 3D 모델 (meshopt 압축, 87 KB)
  iem/                  — IEM 이미지 (직접 추가, 아래 목록)
  eoh/                  — EOH 휠 이미지 (직접 추가, 아래 목록)
```

## 페이지 구성
1. **Hero** (`#home`) — 이름, 한 줄 소개, 이력서 버튼, 프로필 사진
2. **About** (`#about`) — 소개, 전공/스킬, 3가지 포커스 카드
3. **Selected work** (`#work`) — 프로젝트 카드 4개
4. **IEM 스티어링 휠 그립** (`#iem`) — In progress
5. **가변 강성 휠 카** (`#eoh-wheel`) — In progress, 3D 뷰어(휠 rigid / soft / 차량)
6. **SpinLaunch** (`#spinlaunch`)
7. **VEX Robotics** (`#vex`)
8. **Contact** (`#contact`) — 이메일(복사 버튼), LinkedIn, 이력서

## 아직 넣어야 할 파일 (없으면 사이트에 점선 "Image placeholder" 박스로 표시됨)
파일 이름만 맞춰서 넣으면 자동으로 보입니다. 이미지는 가로 약 1600px, webp/jpg, 300 KB 이하 권장.

| 경로 | 내용 |
|---|---|
| `assets/Jae_Geun_Hong_Resume_Cohesive.pdf` | 이력서 (헤더·히어로·연락처·모바일 메뉴의 Resume 버튼) |
| `assets/iem/grip-render.webp` | 그립 렌더, 3/4 뷰 (프로젝트 카드에도 사용) |
| `assets/iem/grip-on-baseplate.webp` | 카본 베이스플레이트 가장자리에 끼운 모습 |
| `assets/iem/grip-section.webp` | 그립 + 베이스플레이트 단면 |
| `assets/iem/grip-printed.webp` | ASA 출력물 사진 |
| `assets/iem/grip-finished.webp` | 알칸타라 커버 씌운 사진 |
| `assets/iem/faceplate-fasteners.webp` | 페이스플레이트 체결부 (스탠드오프, 실링 와셔, 인서트) |
| `assets/iem/finger-groove-wip.webp` | 핑거 그루브 재설계 (진행 중) |
| `assets/eoh/section-rigid.webp` | section_rigid.png |
| `assets/eoh/section-soft.webp` | section_soft_d8.png |
| `assets/eoh/core-iso.webp` | core_iso.png (프로젝트 카드에도 사용) |
| `assets/eoh/shuttle-cord-exit.webp` | shuttle_cord_exit.png |
| `assets/model/eoh-wheel-rigid.glb` | 휠 rigid 상태 3D |
| `assets/model/eoh-wheel-soft.glb` | 휠 soft 상태 3D |
| `assets/model/eoh-car.glb` | 차량 전체 3D |

IEM CAD 파일(STL/STEP)과 내부 문서는 올리지 않습니다 — 스크린샷/렌더만.

### 3D 모델 압축 (STL → GLB)
```
python3 -m pip install trimesh            # STL → GLB (법선 없이, 뷰어가 flat shading 사용)
python3 -c "import trimesh,sys; m=trimesh.load(sys.argv[1],force='mesh'); m.merge_vertices(); m.export(sys.argv[2],file_type='glb',include_normals=False)" part.stl raw.glb
npx gltfpack -i raw.glb -o model.glb -cc   # meshopt 압축 (SpinLaunch: 1.7 MB → 87 KB)
```
폴리곤이 너무 많으면 `-si 0.5` 같이 단순화 비율을 추가하세요.

## 자주 할 수정
- **텍스트 수정**: `index.html`에서 해당 문장을 찾아 바로 고치면 됨
- **포인트 색상 변경**: `assets/css/style.css` 맨 위 `--accent` 값 변경
- **숫자(통계) 수정**: `<span data-count="10">10</span>`처럼 `data-count`와 안의 숫자를 같이 바꾸기
- **진행 상황 변경**: 각 섹션의 `.progress-steps`에서 `is-done` / `is-current` 클래스와 `Done` / `In progress` 표시를 옮기면 됨. 끝나면 `In progress` 배지(`<span class="status">`)를 지우기
- **프로젝트 추가**: `<article class="case" id="...">` 블록을 통째로 복사 → 내용 교체, `#work`에 `work-card` 하나, 상단 `nav`에 링크 하나, `assets/js/main.js`의 `SECTION_IDS`에 id 추가

## 배포
`main` 브랜치에 push하면 GitHub Pages가 1~2분 안에 자동으로 반영함 (Settings → Pages → Deploy from a branch → `main` / root).

## 참고
- 휴대폰 번호는 공개 사이트 특성상 일부러 뺐음
- 애니메이션은 OS의 "동작 줄이기(Reduce motion)" 설정을 켜면 자동으로 꺼짐
