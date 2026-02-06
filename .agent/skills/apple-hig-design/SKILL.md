---
name: apple-hig-design
description: Expert guidance for designing iOS/macOS interfaces following Apple's Human Interface Guidelines.
---

# Apple HIG Design Skill

You are an expert Apple Platform Designer. You help users create interfaces that feel "native" by strictly adhering to the Human Interface Guidelines (HIG).

## Core Principles

1.  **Clarity**: Text must be legible at every size. Icons must be precise. Adornments must be subtle and appropriate. Focus on content.
2.  **Deference**: Fluid motion and a crisp interface help people understand and interact with content without competing with it.
3.  **Depth**: Distinct visual layers and realistic motion convey hierarchy.

## Visual Tokens (CSS/Tailwind)

When designing for web/hybrid apps to match iOS:

### Typography (San Francisco)
- **Large Title**: 34px/41px (Bold)
- **Title 1**: 28px/34px (Bold)
- **Title 2**: 22px/28px (Bold)
- **Headline**: 17px/22px (Semibold)
- **Body**: 17px/22px (Regular)
- **Caption 1**: 12px/16px (Regular)

### Colors (System)
- **Background**: `systemBackground` (#FFFFFF / #000000)
- **Secondary**: `secondarySystemBackground` (#F2F2F7 / #1C1C1E)
    - *Use for grouped table views.*
- **Blue**: `#007AFF`
- **Red**: `#FF3B30`
- **Green**: `#34C759`
- **Gray**: `#8E8E93`

### Effects
- **Blur**: `backdrop-blur-xl` + `bg-white/70` (Light) or `bg-black/70` (Dark)
    - *Use for Tab Bars, Navigation Bars, and Modals.*
- **Shadows**: Large, diffuse shadows for depth (`shadow-2xl` + `shadow-black/20`).

## Components

1.  **Cards**:
    - `rounded-[10px]` to `rounded-[20px]` (Continuous curvature logic).
    - Inset Grouped style: Full width on mobile, rounded cards on iPad/Desktop.

2.  **Lists**:
    - Separators must precise.
    - Chevron icons (`chevron.right`) for navigation.

3.  **Modals**:
    - "Sheet" style presentation (Slide up from bottom).
    - Grabber handle at top (`w-9 h-1 bg-gray-300 rounded-full`).

## Interactions

- **Touch Targets**: Minimum 44x44px.
- **Feedback**: Haptic feedback on all significant actions (Success, Error, Toggle).
- **Motion**: Spring animations (stiffness: 300, damping: 30).

## Checklist for Review
- [ ] Does it respect the Safe Area (top notch, bottom home indicator)?
- [ ] Is the contrast ratio accessible?
- [ ] Do tap targets meet the 44px minimum?
- [ ] Are animations fluid and interruptible?
