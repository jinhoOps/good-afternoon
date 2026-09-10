# 배경과 잉크 장면 제작 기록

## 감사 스크롤의 인사 장면 — 2026-09-10

- 사용자가 직접 제공한 GIF이며 제롬 파월의 인사에서 가져온 서비스 이름을 마지막에 회수하는 이스터에그입니다.
- 원본 보존: [good-afternoon.gif](good-afternoon.gif), 245×320, 122프레임, 10fps, 12.2초. 입력은 `/Users/jinho/Downloads/e60e9effba8247d27cbd514efb120d189cc4364d11e54be2835b8021488e7894.gif`입니다.
- 브라우저 재생본: [good-afternoon.mp4](good-afternoon.mp4). 일시정지·동작 감소·인라인 무음 재생을 지원하기 위해 H.264로 변환했습니다. 재생 길이와 프레임 수를 보존하며 인코딩에 필요한 오른쪽 1px 패딩만 추가했습니다. 이미지를 재생성하지 않았습니다.
- 감사 스크롤 끝에 도달하기 전에는 영상 URL을 DOM에 연결하지 않습니다. 원본 GIF는 실행 번들에 포함하지 않습니다.

```sh
ffmpeg -hide_banner -loglevel error -i src/market-game/assets/good-afternoon.gif -an -vf pad=246:320:0:0 -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart src/market-game/assets/good-afternoon.mp4
```


## 현재 사용하는 그림 — 2026-09-10

실행 장면은 `market-ink.png`, `park-ink.png`이며 웹 배경은 `web-daylight.png`, `web-evening.png`입니다. 아래 기존 `market.png`, `park.png`는 구도 참고 원본으로 보존합니다. 네 새 파일은 내장 `image_gen.imagegen`으로 만들고 직접 시각 확인한 결과입니다.

### 잉크 장터

- 기법 참고: [Ink Drawings 7 — Den Pakowacz](https://www.behance.net/gallery/250524029/Ink-Drawings-7). Orca 브라우저에서 페이지와 실제 작품 이미지를 열어 확인했습니다.
- 기법 참조 파일: `/tmp/good-afternoon-atmosphere-qa/ink-style-reference.webp`. 원작 그림은 제품에 포함하지 않았습니다.
- 동네: [market-ink.png](market-ink.png), 1536×1024. 생성 원본 `/Users/jinho/.codex/generated_images/01a088e5-f5fb-7371-abf7-6f1242bb0efb/exec-7dd078bf-578d-43d7-bcb5-acc39153447e.png`.
- 공원: [park-ink.png](park-ink.png), 1536×1024. 생성 원본 `/Users/jinho/.codex/generated_images/01a088e6-449b-7c10-baa3-9a5793fce9c5/exec-17c130ad-795b-4e4f-a4d4-7f6d84279738.png`.
- 편집 입력은 각 기존 장면과 기법 참조입니다. 구도·카트·주인·빈 간판·하단 여백을 보존하며, 검은 펜 선과 회색 워시, 노란 차양과 레몬으로 바꿨습니다. 재고·손님·보관·날씨·조작은 기존 게임에서 표시합니다.

동네 프롬프트:

```text
Use case: style-transfer
Asset type: production browser game scene, 1536 x 1024 pixels, 3:2 landscape.
Input images: Image 1 is the EXACT composition and scene edit target (the existing neighborhood lemonade market). Image 2 is ONLY a reference for drawing technique and restrained ink-and-yellow palette. Do not copy the subject or page presentation from Image 2.
Primary request: redraw Image 1 as a lively hand-drawn fountain-pen ink sketch with irregular line weight, slightly wobbly and incomplete contours, expressive loose crosshatching, and a few loose gray ink washes. Use mostly white or very light neutral paper, black/dark gray ink, and selective ochre yellow watercolor on the striped awning, lemons, and lemonade. A tiny amount of subdued gray-green wash may remain on the cart. Keep the overall scene airy and mostly monochrome. Avoid beige, cream, brown or aged-paper cast.
Preserve the composition and identity of Image 1: the same friendly young woman with dark hair in a loose bun and light apron behind the lemonade cart centered near x=62%; the same striped fabric awning, large cart wheel, glass lemonade dispenser, lemons and small pots; a large tree framing the upper-left; the same village storefronts and distant little market stalls. The hanging sign must stay completely blank.
Composition: match the existing cart and shopkeeper positions precisely, preserve the camera and 3:2 landscape framing. Keep the bottom 25% as largely empty light pavement with only sparse faint pen lines and subtle soft gray shadows, leaving usable empty foreground for a live game inventory overlay. Do not add props or people in this foreground.
Style priority: visible imperfect pen craftsmanship and lively hatching like the second reference; hand-drawn editorial sketch, not smooth decorative vector line art. Simplify small background details into loose suggested marks. The result must NOT look like a polished gouache painting, rendered animation, 3D illustration, photographic scene, or digitally airbrushed scene. No glossy volumetric shading.
Constraints: no text, letters, symbols, branding, signatures, watermark, UI, cards, numbers, buttons or borders. No sketchbook, notebook spine, page edges, visible frame, camera view of a drawing, pancakes, bees or other objects borrowed from the style reference. The drawing fills the entire image.
```

공원 프롬프트:

```text
Use case: style-transfer.
Asset type: in-game park lemonade-cart scene, 1536 by 1024 pixels, landscape 3:2.
Image 1 is the scene edit target: preserve its exact composition, same friendly dark-haired young woman shopkeeper with bun and apron behind her cart, same cart at roughly x=60%, yellow-and-white striped awning, blank hanging sign, lemonade dispenser and lemons. Keep the framing trees and winding path, park bench and bicycle at left, lake and little footbridge behind, and concert pavilion at right. Maintain clear lightly detailed ground across the bottom 25% for the game's live counter overlay.
Image 2 is a DRAWING TECHNIQUE REFERENCE ONLY: use lively fountain-pen drawing with uneven pressure and irregular line weight, slightly wobbly expressive contours, visible short hatching and crosshatching, loose translucent pale gray ink washes, open white paper, and selective warm ochre-yellow accents on the striped canopy, lemons and lemonade. The cart may have a very faint desaturated gray-green wash. The predominant image must be black pen on white/light-neutral paper with yellow accents. Simplify the dense foliage into spontaneous economical pen marks and intermittent washed shapes, leaving breathing room. Faces and hands should be loose gentle pen drawings, not polished anime rendering. Make it feel observably handmade and incomplete in places, like a lively on-location ink drawing.
Do not copy any content from image 2: no pancakes, bees, signature, writing, sketchbook, page fold, notebook border or frame. No beige cast or cream aged paper. No UI, text, numbers, logo or watermark. No crowds. No high-saturation full-color painting, smooth airbrushed shading, 3D, glossy rendering, or polished anime aesthetic. Produce the park scene alone, drawn edge to edge without book framing. Preserve the blank hanging sign and empty light lower foreground.
```

### 웹 바탕

- 낮: [web-daylight.png](web-daylight.png), 1402×1122. 생성 원본 `/Users/jinho/.codex/generated_images/01a088e5-f5fb-7371-abf7-6f1242bb0efb/exec-70ee988c-badf-48ee-9866-e24cceacbf34.png`.
- 밤: [web-evening.png](web-evening.png), 1402×1122. 생성 원본 `/Users/jinho/.codex/generated_images/01a088e6-449b-7c10-baa3-9a5793fce9c5/exec-94c5e8b9-6b0a-4c68-953b-93d22558a27d.png`.
- 사용자 선택 시안의 게임·인터페이스·장식 글씨를 제거한 배경 전용 편집입니다. 낮은 흰 벽과 잎 그림자, 밤은 차콜 벽과 작은 조명·가장자리 식물이며 우측 칠판도 제거했습니다.
- 요청 치수는 1440×1152, 실제 생성 치수는 1402×1122입니다. 원본을 변형 없이 사용하고 CSS의 비율 유지 cover로 화면을 채웁니다.

낮 프롬프트:

```text
Use case: precise-object-edit
Asset type: production website daylight background raster, no interface.
Input image: the attached selected design mockup is the edit target. Extract and reconstruct ONLY its surrounding white wall daylight background. Remove every foreground UI element and reconstruct a seamless white wall underneath.
Primary request: a 1440 by 1152 landscape image of a near-pure neutral white wall, with naturally soft out-of-focus leaf and thin branch SHADOWS entering from the upper-left corner and lower-right outer edge. Preserve the selected reference's quiet white daylight atmosphere and subtle photographic light falloff.
Composition: shadow detail is concentrated at the outer margins; keep the broad central rectangle from x=8% to 92% and y=10% to 93% clean, nearly white, and extremely low contrast for readable UI to be overlaid later. Let soft fragments fade inward organically without any rectangular masks. Daylight feels slightly brighter toward the top-right. Shadows are neutral light gray, airy, with natural penumbra; not black or dominant.
Constraints: ONLY the wall surface and light/shadow, no actual foliage, branches, trees or other physical objects. No scene illustration, buildings, drink cart, people, lemons, panels, cards, text, letters, logos, icons, buttons, borders, dividing lines, footer, money, graphic marks, watermark or UI of any kind. Replace all existing UI and game imagery with continuous white wall. No cream, beige, brown or blue base. No mesh gradient, no paper grain, no visible plaster texture or noise. The wall should read as clean neutral white rather than a beige canvas. No artificial vignette.
```

밤 프롬프트:

```text
Use case: precise-object-edit.
Asset type: reusable full-page website background, 1440 by 1152 pixels, landscape 5:4. This must be a BACKGROUND PLATE ONLY, not a website mockup.
Input image 1 is the edit target. Keep the original nighttime cafe-wall mood, palette, delicate realistic matte wall texture, small brass pendant lamp at the extreme upper left and soft physical amber light pool beneath it. Keep a subdued plant silhouette only at the extreme bottom-left edge.
Remove the entire central game illustration and all website UI. Remove every panel, card, button, number, icon, line, border, logo, heading, handwritten text, caption and watermark. Remove the right-side chalkboard completely, including board, frame, feet and chalk writing. Inpaint all removed areas as a continuous warm dark-charcoal matte wall. Center area x=9% through 91% must be entirely empty calm dark wall with only subtle organic texture and low-contrast natural illumination. There must be no rectangles or visible traces of the removed website. Keep the right side blank wall, no replacement objects.
Lamp compact near x=4%, y=8%, plant mostly clipped by the left and bottom edges, so future live website UI placed centrally remains unobstructed.
Lighting warm, intimate, restrained, realistic falloff, atmospheric photography. No purple, no neon, no dramatic bright glow or fake CSS gradient. No words, no letters, no symbols, no game scene, no user interface. Produce only the finished clean nighttime background image.
```

## 이전 공원 장터

- 제작일: 2026-09-10
- 제작 방식: Codex 내장 `image_gen.imagegen`, 기존 `market.png`를 스타일·인물·노점 참고 이미지로 사용했습니다.
- 최종 사용 파일: [park.png](park.png), 1536×1024 PNG
- 생성 원본: `/Users/jinho/.codex/generated_images/01a08529-e508-7132-8b9a-47fd1746cf29/exec-dc98e6f4-0562-494c-88f0-e4b77a24fb1d.png`
- 같은 가게가 공원으로 이동한 장면을 확인한 뒤 원본 그대로 복사했습니다. 간판·날씨·손님·재고는 코드로 표시합니다.

### 공원 프롬프트

```text
Use case: illustration-story. Asset type: actual landscape background for a cozy Korean browser lemonade shop game, not UI. Reference image: existing neighborhood cart artwork, use as a style and character/composition reference. Create a new second location for the SAME sage green lemonade cart and cream-apron shopkeeper with butter-yellow striped awning, situated in a green public park. Match the reference's handcrafted gouache and colored-pencil paper texture, warm limited color palette, inviting clear afternoon lighting and detailed storybook craftsmanship. Replace the houses and stone marketplace with open grassy lawns, mature shade trees, a gently winding walking and cycling path, a small distant wooden outdoor concert pavilion, a park bench and a bicycle resting nearby. No crowd and no additional foreground people; visitors are drawn by the game. Keep the cart slightly right of center and occupying the middle third, with a blank hanging sign. Leave broad empty warm sandy walkway in foreground for the live game counter overlay. 1536x1024 landscape composition, readable when cropped for mobile. No text, no letters, no numbers, no logo, no interface, no watermark. Preserve the reference cart identity and the same shopkeeper.
```

## 이전 동네 장터

- 제작일: 2026-09-09
- 제작 방식: Codex 내장 이미지 생성 도구 `image_gen.imagegen`
- 최종 사용 파일: [market.png](market.png), 1536×1024 PNG
- 생성 원본: `/Users/jinho/.codex/generated_images/01a08529-e508-7132-8b9a-47fd1746cf29/exec-b4df0901-199a-4c34-a4df-b9ea71ef1a4e.png`
- 생성 이미지를 확인한 뒤 그대로 프로젝트에 복사했습니다. 손님 반응, 재고, 날씨 효과와 조작 화면은 이미지에 포함하지 않고 게임 코드에서 표시합니다.

## 사용한 프롬프트

```text
Use case: illustration-story
Asset type: landscape background artwork for a playable Korean cozy lemonade market game, no UI.
Create a beautiful handcrafted gouache and colored-pencil illustrated scene, landscape 3:2 aspect ratio. A charming small wooden lemonade street cart stands slightly right of center in a leafy Korean neighborhood weekend market. Large butter-yellow and cream striped canvas awning, muted sage green cart body, wooden counter with a glass lemonade dispenser and a few lemons, tiny potted flowers. A friendly young adult shopkeeper wearing a cream apron stands behind the counter. A pale mint-green low building, soft terracotta roof and climbing greenery behind it, neighboring storefront at far right, large leafy tree framing left side. Broad empty warm sandy pedestrian walkway across the foreground to leave space for game overlays. Cozy board-game storybook illustration with tactile paper grain, confident shapes, sophisticated limited warm palette, soft afternoon shadows, lively but uncluttered. Cart occupies middle third so whole scene readable on mobile cropping. Keep blank hanging shop sign on awning. No text, no letters, no numbers, no UI, no watermarks, no photographic or 3D rendering. This is the actual game scene, not a website mockup.
```
