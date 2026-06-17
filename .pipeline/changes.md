# Changes: Expandable Attached Photo in VariationRow

## Summary

Added clickable photo thumbnail and inline expand toggle to `VariationRow`. Variations with a `photo_url` now show a 48×48 thumbnail on the right side of the card. Clicking it expands the full photo inline beneath the variation details; a `ChevronUp` button collapses it.

## Files Modified

| File | Lines changed |
|------|--------------|
| `src/components/variations/VariationRow.tsx` | +28, -4 |

## Changes Detail

- Removed `Image` lucide import, added `ChevronUp`
- Added `photoOpen` state (`useState(false)`)
- Replaced `<Image>` badge (w-3.5 h-3.5 icon) with a `<button>` thumbnail (48×48, `object-cover`, `rounded-lg`) in the right column alongside the cost
- Right column changed from `text-right shrink-0` to `flex items-start gap-2 shrink-0` to accommodate thumbnail
- Added conditional expanded photo block below the main row — `w-full rounded-lg object-contain bg-gray-50 max-h-64` with a `ChevronUp` close button overlaid top-right
- Follows `img` tag ESLint suppress pattern from `sign/[token]/page.tsx`

## Deviations from spec.md

Zero deviations. Spec said thumbnail goes on the "right side" (edge case 4) — placed in right column next to cost, consistent with that note.
