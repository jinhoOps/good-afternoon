# 장터 배경 제작 기록

## 공원 장터

- 제작일: 2026-09-10
- 제작 방식: Codex 내장 `image_gen.imagegen`, 기존 `market.png`를 스타일·인물·노점 참고 이미지로 사용했습니다.
- 최종 사용 파일: [park.png](park.png), 1536×1024 PNG
- 생성 원본: `/Users/jinho/.codex/generated_images/01a08529-e508-7132-8b9a-47fd1746cf29/exec-dc98e6f4-0562-494c-88f0-e4b77a24fb1d.png`
- 같은 가게가 공원으로 이동한 장면을 확인한 뒤 원본 그대로 복사했습니다. 간판·날씨·손님·재고는 코드로 표시합니다.

### 공원 프롬프트

```text
Use case: illustration-story. Asset type: actual landscape background for a cozy Korean browser lemonade shop game, not UI. Reference image: existing neighborhood cart artwork, use as a style and character/composition reference. Create a new second location for the SAME sage green lemonade cart and cream-apron shopkeeper with butter-yellow striped awning, situated in a green public park. Match the reference's handcrafted gouache and colored-pencil paper texture, warm limited color palette, inviting clear afternoon lighting and detailed storybook craftsmanship. Replace the houses and stone marketplace with open grassy lawns, mature shade trees, a gently winding walking and cycling path, a small distant wooden outdoor concert pavilion, a park bench and a bicycle resting nearby. No crowd and no additional foreground people; visitors are drawn by the game. Keep the cart slightly right of center and occupying the middle third, with a blank hanging sign. Leave broad empty warm sandy walkway in foreground for the live game counter overlay. 1536x1024 landscape composition, readable when cropped for mobile. No text, no letters, no numbers, no logo, no interface, no watermark. Preserve the reference cart identity and the same shopkeeper.
```

## 동네 장터

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
