# Pre-Cyan Phaser DOM Removal Gate

## Decision

Phaser is the default Pre-Cyan runtime. The default local entry is `/good-afternoon/`; a Phaser runtime query flag is no longer required.

DOM runtime source has been removed from the Pre-Cyan entry/source path. It is not maintained as a fallback.

## Verification Criteria

Completed or required verification for this gate:

- `npm test` passes.
- `npm run build` passes.
- `npm run test:smoke` passes when a preview server is running.
- DOM id/source scan confirms the removed DOM runtime is not still wired into the entry path.
- Banned string scan confirms the Pre-Cyan first experience does not surface prohibited learning/checklist/completion language.

## Residual Risks

- Phaser still raises a bundle size warning during production build.
- Current smoke coverage is intentionally narrow: initial room rendering and mobile viewport behavior.
- Fuller gameplay smoke for movement, interaction order, return flow, persistence, and asset failure states remains future work.
