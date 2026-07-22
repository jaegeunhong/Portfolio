# Portfolio Site — GitHub Pages 배포 방법

## 1. GitHub 레포 만들기
1. github.com 로그인 → 우측 상단 **+** → **New repository**
2. Repository name: `portfolio` (원하는 이름 아무거나 가능)
3. **Public**으로 설정 (Private이면 GitHub Pages 무료로 안 켜짐 — 학생 계정이면 Private도 가능할 수 있음)
4. **Create repository**

## 2. 파일 업로드
1. 방금 만든 레포 페이지에서 **Add file → Upload files**
2. 이 zip 안의 파일/폴더를 전부 그대로 드래그해서 업로드 (index.html, assets 폴더 전체 구조 그대로 유지)
3. 폴더째로 드래그하면 구조가 그대로 유지됨 (assets/img, assets/video 하위 폴더 포함)
4. **Commit changes**

## 3. GitHub Pages 켜기
1. 레포 상단 **Settings** 탭
2. 왼쪽 메뉴에서 **Pages**
3. **Source**를 **Deploy from a branch**로 설정
4. Branch: **main** (또는 master), 폴더: **/ (root)** 선택 → **Save**
5. 1~2분 기다리면 상단에 사이트 주소가 뜸 (보통 `https://<username>.github.io/<repo이름>/` 형태)

## 4. 확인
사이트 주소로 접속해서 이미지/영상 다 잘 뜨는지 확인. 영상이 안 뜨면 브라우저 새로고침(캐시 문제일 수 있음) 한 번 더 해보기.

## 폴더 구조
```
index.html
assets/
  img/       — 사진 + 영상 썸네일
  video/     — 압축된 mp4 영상 4개
```

## 참고
- 폰(휴대폰) 번호는 공개 사이트 특성상 일부러 뺐어. 필요하면 index.html에서 직접 추가 가능
- 나중에 프로젝트 추가하고 싶으면 index.html에 `<section class="sheet">` 블록 하나 더 복사해서 내용만 바꾸면 됨
