# Visual Design Instructions

## Professional ECG Healthcare Web Application

> This document defines the **visual language, art direction, UI aesthetics, typography, color usage, composition, imagery, motion, spacing, and design philosophy** for the ECG healthcare website.
>
> The goal is to create a sophisticated healthcare product that feels **human-designed, medically credible, editorial, precise, and visually distinctive**.
>
> This document does **not** prescribe the complete website layout or page structure.

---

# 1. Core Visual Direction

Design the website as a **premium medical technology product**, not as a generic AI SaaS website.

The visual identity should communicate:

* Clinical precision
* Scientific credibility
* Modern medical technology
* Calmness
* Human trust
* Sophistication
* Data-driven intelligence

The design should feel closer to:

> **A modern medical instrument + premium editorial design + scientific visualization**

rather than:

> **A generic AI startup landing page**

---

# 2. The Most Important Rule

## Do NOT use the typical "AI-generated website" aesthetic.

Avoid the following visual patterns unless there is a very strong reason:

* Purple-to-blue gradients
* Blue-to-pink gradients
* Glowing neon borders
* Glassmorphism everywhere
* Excessive blur
* Floating gradient blobs
* Huge glowing buttons
* Excessive rounded cards
* Every section inside a card
* Excessive shadows
* Random 3D AI illustrations
* Robot/brain graphics
* Generic AI circuit illustrations
* Overuse of emojis
* Excessive animated particles
* "AI POWERED" badges everywhere
* Huge centered hero headings with gradient text
* Excessive pill-shaped UI
* Generic stock-photo doctors
* Excessive dashboard widgets

The website should have **visual restraint**.

---

# 3. Design Philosophy

Follow:

```text
Less decoration
       +
More composition
       +
More typography
       +
More whitespace
       +
More real data visualization
       +
More intentional details
```

The design should not depend on decorative effects to appear attractive.

Instead, visual quality should come from:

* Typography
* Grid systems
* Alignment
* Proportion
* Contrast
* Spacing
* Information hierarchy
* Real ECG visualizations
* Carefully selected imagery
* Subtle interaction

---

# 4. Visual Personality

The website should feel:

### Precise

Interfaces should feel engineered rather than decorated.

### Calm

Healthcare users should not feel overwhelmed.

### Intelligent

The design should communicate technical capability without shouting "AI".

### Human

Avoid making the website feel like an automated machine interface.

### Clinical

Use visual conventions associated with medical instruments and clinical environments.

### Premium

Use spacing, typography, and composition to create sophistication rather than expensive-looking effects.

---

# 5. Design Reference Direction

Use these broad design characteristics as inspiration:

```text
Modern healthcare
        +
Medical instrumentation
        +
Scientific publishing
        +
Swiss / editorial typography
        +
Minimal industrial design
```

The visual language should have a **high signal-to-noise ratio**.

Every visual element should have a purpose.

---

# 6. Color Philosophy

Color should be used as a **functional design system**, not as decoration.

Do not make the entire website blue.

Instead, use a restrained neutral foundation.

Suggested approach:

```text
Primary background
Warm white / soft off-white

Secondary background
Very light neutral

Primary text
Deep charcoal

Secondary text
Muted gray

Primary accent
Deep medical blue / restrained teal

Clinical positive
Muted green

Clinical warning
Muted amber

Clinical critical
Controlled red
```

The exact colors may be adjusted during implementation.

---

# 7. Avoid Gradient-First Design

Do not use:

```css
background: linear-gradient(...);
```

as the default solution for making sections attractive.

Gradients should be rare.

If a gradient is used, it should serve a specific visual purpose.

For example:

* subtle background transition
* image treatment
* depth
* data visualization

Never use gradients simply because the page feels empty.

---

# 8. Color Hierarchy

Use approximately:

```text
70–80%
Neutral colors

10–20%
Primary brand/accent colors

Small percentage
Clinical status colors
```

This creates visual hierarchy.

Do not make every component colorful.

---

# 9. Accent Color Strategy

Choose **one dominant accent family**.

For example:

```text
Deep blue
+
Muted cyan/teal
```

or:

```text
Deep navy
+
Clinical green
```

Do not use:

```text
Blue
Purple
Pink
Orange
Green
Cyan
```

simultaneously as primary visual accents.

That creates a dashboard-like appearance.

---

# 10. Typography

Typography should carry a significant portion of the visual identity.

Avoid using a generic typography hierarchy such as:

```text
Huge bold heading
Medium subtitle
Small gray text
```

for every section.

Instead, create an editorial typographic system.

Use:

* Strong display typography
* Highly readable body typography
* Small technical labels
* Monospaced typography for data where appropriate

---

# 11. Font Pairing

Consider a combination such as:

```text
Primary:
Inter
Manrope
DM Sans
IBM Plex Sans

Technical:
IBM Plex Mono
JetBrains Mono
Roboto Mono
```

Another possibility is an editorial pairing:

```text
Sans-serif
+
Serif accent
```

Use serif typography sparingly.

The goal is to avoid the appearance of a template.

---

# 12. Typography Contrast

Use contrast through:

* Size
* Weight
* Width
* Spacing
* Case
* Font family

not only through color.

Example:

```text
ECG ANALYSIS
12-14px / uppercase / tracked

Normal Sinus Rhythm
large / strong

94.2%
very large / compact

Model confidence
small / muted
```

This creates hierarchy without requiring colorful cards.

---

# 13. Technical Typography

For values related to medical or technical information, a monospace font can create an instrumentation aesthetic.

Use it for:

```text
ECG-2026-00128
500 Hz
10.0 s
94.2%
Lead II
12-channel
```

Do not use monospace for everything.

It should be an accent.

---

# 14. Layout Philosophy

Do not design every section as:

```text
┌───────────────┐
│   Card        │
│               │
└───────────────┘
```

Instead, use a mixture of:

* Open layouts
* Full-width sections
* Editorial columns
* Thin dividers
* Data panels
* Asymmetric compositions
* Large whitespace
* Edge-aligned elements
* Image + typography compositions

---

# 15. Grid System

Use a strong underlying grid.

For desktop, consider:

```text
12-column grid
```

or another consistent grid system.

Elements should align with the grid.

Avoid randomly positioning components.

The grid should be visually invisible but structurally present.

---

# 16. Asymmetry

Do not make every section perfectly symmetrical.

Controlled asymmetry can make the website feel more designed.

Example:

```text
┌──────────────────────────────────────────────┐
│                                              │
│  ECG SIGNAL                                  │
│                                              │
│  Large editorial statement      ECG graphic │
│                                 ───────────  │
│                                 waveform     │
│                                              │
└──────────────────────────────────────────────┘
```

Use asymmetry intentionally.

Do not make layouts asymmetric merely for novelty.

---

# 17. Whitespace

Whitespace is one of the primary visual tools.

Do not fill every empty area.

Large whitespace can communicate:

* confidence
* quality
* calmness
* importance
* professionalism

A premium interface often has **less content per viewport**, but stronger hierarchy.

---

# 18. Borders Instead of Shadows

Prefer subtle borders over large shadows.

Example:

```text
1px solid rgba(...)
```

Use shadows sparingly.

Avoid:

```css
box-shadow: 0 20px 60px rgba(...);
```

on every card.

Healthcare interfaces should generally feel **flat, precise, and stable**.

---

# 19. Border Radius

Do not make everything extremely rounded.

Avoid:

```text
border-radius: 30px
border-radius: 40px
border-radius: 9999px
```

for normal containers.

Prefer a restrained radius system such as:

```text
4px
6px
8px
12px
```

Use larger radius only where it has a clear purpose.

---

# 20. Cards

Cards should not become the fundamental building block of the entire website.

Use cards for:

* Important grouped information
* Data summaries
* Interactive objects
* Patient records
* Analysis results

Do not put every paragraph into a card.

---

# 21. Open Information Design

Some information should exist directly on the page.

Example:

```text
MODEL CONFIDENCE

94.2%

The model identified the signal pattern
with high confidence.
```

This can be visually stronger than:

```text
┌─────────────────────┐
│ Confidence Card     │
│ 94.2%               │
└─────────────────────┘
```

Use open composition where appropriate.

---

# 22. ECG as a Visual Identity

The ECG waveform itself should become part of the visual identity.

Do not use generic AI imagery as the primary visual.

Use actual ECG-inspired geometry.

For example:

```text
──────────────────────╱╲───────╱╲──────
                      ╱  ╲     ╱  ╲
─────────────────────╯    ╲───╯    ╲────
```

The ECG signal can appear subtly in:

* Hero sections
* Dividers
* Background details
* Loading states
* Analysis interfaces
* Section transitions
* Decorative elements

But it must remain sophisticated.

---

# 23. ECG Grid

A subtle ECG paper grid can be used as a design motif.

Example:

```text
┼──┼──┼──┼──┼──┼──
│  │  │  │  │  │
┼──┼──┼──┼──┼──┼──
│  │  │  │  │  │
┼──┼──┼──┼──┼──┼──
```

Keep it extremely subtle.

Do not turn the entire website into a literal ECG sheet.

---

# 24. Scientific Visualization

Use real data visualization as a visual asset.

Instead of:

```text
AI brain illustration
```

prefer:

```text
ECG waveform
Signal processing visualization
Frequency spectrum
Heart-rate timeline
Lead comparison
Model probability distribution
```

Real data makes the interface feel authentic.

---

# 25. ECG Waveform Styling

The waveform should be:

* sharp
* precise
* thin
* technically accurate-looking
* visually clean

Avoid thick glowing neon ECG lines.

Avoid:

```text
bright cyan glow
neon green glow
```

Prefer a restrained stroke with subtle contrast.

---

# 26. Image Strategy

If photography is used, avoid generic stock photography.

Avoid:

```text
Smiling doctor pointing at laptop
Doctor wearing stethoscope looking at camera
Generic hospital corridor
Generic AI doctor illustration
```

Instead use:

* close-up medical instrumentation
* ECG machines
* ECG paper
* clinical environments
* hands interacting with medical equipment
* abstract but realistic medical details
* carefully composed architectural healthcare imagery

Photography should feel documentary/editorial rather than promotional.

---

# 27. Medical Photography

Use photography with:

* natural lighting
* restrained color grading
* realistic environments
* shallow depth of field where appropriate
* minimal staged poses

Avoid overly polished stock-photo aesthetics.

---

# 28. Illustration Style

If illustrations are needed, use:

* scientific diagrams
* anatomical line drawings
* ECG schematics
* technical diagrams
* minimal vector illustrations

Avoid:

* 3D floating hearts
* glowing brains
* holographic doctors
* AI robots
* floating UI windows

---

# 29. Iconography

Use one icon system consistently.

Recommended:

```text
Lucide
```

Icons should be:

* thin
* geometric
* consistent
* functional

Avoid using icons purely as decoration.

---

# 30. Icons + Text

Prefer:

```text
[icon] ECG Analysis
```

over:

```text
Huge icon
      ↓
Large card
      ↓
Decorative description
```

Keep icons subordinate to information.

---

# 31. Buttons

Buttons should feel like controls on a professional application.

Avoid huge pill buttons.

Prefer:

```text
[ Analyze ECG ]
```

with:

* moderate height
* restrained radius
* clear typography
* subtle hover state

Primary buttons should have strong contrast but not excessive visual effects.

---

# 32. Button Interaction

Use subtle interaction.

Example:

```text
Default
      ↓
Slight background change
      ↓
Pressed
      ↓
Small movement
```

Avoid:

* glowing borders
* particle effects
* dramatic scaling
* neon hover effects

---

# 33. Microinteractions

Use motion to communicate system state.

Good examples:

```text
Upload
  ↓
Progress
  ↓
Processing
  ↓
Analysis complete
```

The animation should explain what is happening.

Do not animate simply to make the website "look modern."

---

# 34. Motion Philosophy

Use:

```text
Subtle
Fast
Purposeful
Predictable
```

Avoid:

```text
Slow
Bouncy
Exaggerated
Continuous
Distracting
```

Healthcare interfaces should feel stable.

---

# 35. Page Transitions

If page transitions are used:

* Use short fades
* Small vertical movement
* Smooth opacity changes

Avoid large cinematic transitions.

---

# 36. Scroll-Based Effects

Use scroll effects sparingly.

Good:

```text
Typography gradually entering viewport
ECG waveform drawing itself
Image subtly revealing
```

Avoid:

```text
Everything flying in
Everything rotating
Parallax everywhere
```

---

# 37. Hero Section Philosophy

The hero should not look like a standard AI landing page.

Avoid:

```text
Huge gradient heading

"Revolutionizing Healthcare With AI"

[ Get Started ]

Glowing 3D heart
```

Instead, create a visually composed introduction.

Possible direction:

```text
Small technical label

ECG / ANALYSIS SYSTEM

Large editorial heading

Understanding cardiac signals
through intelligent analysis.

                        ECG waveform
                        ───────────╱╲────
                                    ╲╱──

Small supporting information
```

The actual copy can be changed, but the composition should remain sophisticated.

---

# 38. Hero Composition

Consider:

```text
LEFT
Typography
Information
CTA

RIGHT
Real ECG visualization
or medical instrumentation imagery
```

But do not force this structure on every screen.

Use the composition that best communicates the content.

---

# 39. Technical Labels

Small labels can create a medical-instrument aesthetic.

Examples:

```text
ECG / 12-LEAD
SIGNAL ANALYSIS
MODEL STATUS
SAMPLING RATE
PATIENT RECORD
ANALYSIS ID
```

Use:

* small font
* uppercase
* letter spacing
* muted color

Do not overuse them.

---

# 40. Data Aesthetic

Use real data as design.

For example:

```text
10.0 s
500 Hz
12 LEADS
5,000 SAMPLES
```

These details can create a strong technical identity.

But only display information that actually exists.

---

# 41. Visual Density

Different parts of the application should have different densities.

### Marketing / introductory sections

Low density.

### ECG analysis interface

Medium/high density.

### Clinical review interface

High information density.

### Reports

Structured density.

Do not use the same spacing everywhere.

---

# 42. Analysis Interface

The ECG analysis screen can intentionally feel more like a **medical instrument** than a marketing website.

Use:

* precise borders
* technical labels
* waveform
* measurements
* restrained colors
* compact controls

Avoid decorative elements.

---

# 43. Dashboard Philosophy

Do not create a dashboard containing:

```text
20 colorful cards
+
5 charts
+
3 gradients
+
large numbers everywhere
```

Instead prioritize the user's task.

For example:

```text
Recent Analysis
────────────────────────────────────

ECG waveform

Prediction
Normal Sinus Rhythm

Confidence
94.2%

[Review Analysis]
```

The interface should feel purposeful.

---

# 44. Information Hierarchy

A user should immediately understand:

```text
What am I looking at?
        ↓
What does it mean?
        ↓
What should I do next?
```

This should be achieved visually.

---

# 45. Result Emphasis

The primary result should be visually dominant.

Example:

```text
MODEL PREDICTION

Normal Sinus Rhythm

94.2% confidence
```

The prediction should not be hidden among ten equal cards.

---

# 46. Critical Information

When information is important, use:

* position
* size
* whitespace
* contrast

before using:

* bright colors
* animations
* glow

Visual hierarchy should do most of the work.

---

# 47. Dark Mode

Dark mode should not simply invert the light theme.

Use a deliberately designed dark palette.

Prefer:

```text
Near-black / charcoal
+
Soft gray
+
Muted blue/teal
```

Avoid pure:

```text
#000000
```

everywhere.

---

# 48. ECG in Dark Mode

The ECG waveform should remain readable.

Avoid neon styling.

A restrained bright line on a dark background is enough.

The ECG grid should remain subtle.

---

# 49. Light Mode

Light mode should be the primary healthcare experience.

Use:

```text
Warm white
Soft gray
Deep charcoal
Muted medical accent
```

Avoid extremely bright pure-white interfaces with no visual separation.

---

# 50. Depth

Create depth through:

1. Spacing
2. Borders
3. Typography
4. Layering
5. Subtle shadows

Do not rely entirely on shadows.

---

# 51. Backgrounds

Backgrounds should remain quiet.

Good:

```text
#F8F8F6
#F5F6F4
soft neutral
```

Possible subtle texture:

* ECG grid
* fine noise
* paper texture

But keep opacity extremely low.

---

# 52. Texture

A very subtle texture can make the website feel less synthetic.

Possible textures:

```text
fine paper grain
very subtle noise
ECG paper pattern
```

Do not make the texture noticeable.

It should be perceived subconsciously.

---

# 53. Separators

Use thin lines to divide information.

Example:

```text
────────────────────────────────────
```

This can look more sophisticated than multiple cards.

Use separators especially for:

* medical reports
* patient information
* analysis metadata
* technical specifications

---

# 54. Editorial Sections

For important sections, consider editorial composition.

Example:

```text
01

SIGNAL
PROCESSING

────────────────────────

Raw cardiac signals contain
patterns that require careful
analysis.

                         waveform
```

This style makes the website feel more like a designed product than a template.

---

# 55. Numbered Sections

Use numbered labels selectively:

```text
01
02
03
04
```

This can create a technical/editorial visual language.

Do not use numbering for every component.

---

# 56. Lines as Design Elements

Thin horizontal and vertical lines can create structure.

Example:

```text
01 ───────────── ECG ANALYSIS
```

or:

```text
│
│  SIGNAL PROCESSING
│
```

This can provide visual sophistication without decorative graphics.

---

# 57. Composition Over Decoration

When a section looks empty, do not immediately add:

```text
gradient
illustration
floating circles
glow
shadow
```

Instead ask:

```text
Can typography become larger?

Can whitespace increase?

Can the ECG visualization become more prominent?

Can the grid become stronger?

Can an image create balance?

Can the composition become asymmetric?
```

---

# 58. Avoid Template Patterns

Do not repeatedly use:

```text
Heading
Subtitle
3 Cards
Heading
4 Cards
Heading
2 Cards
```

This is one of the strongest indicators of AI-generated website design.

Vary composition.

---

# 59. Visual Rhythm

Create rhythm through changes in:

```text
Large
Small
Dense
Open
Image
Typography
Data
Whitespace
```

For example:

```text
Large typography
      ↓
Dense technical information
      ↓
Large ECG visualization
      ↓
Whitespace
      ↓
Editorial section
```

This creates a more intentional experience.

---

# 60. Avoid Excessive Rounded UI

Do not make:

* navbar
* cards
* buttons
* inputs
* charts
* modals
* sections

all have the same rounded appearance.

Different components can have different geometry.

Healthcare equipment often has **precise geometry**, not everything rounded.

---

# 61. Geometry

Use a combination of:

```text
Rectangles
Small radius
Thin borders
Occasional circles
Lines
Large typography
```

This creates a more technical aesthetic.

---

# 62. Visual Branding

The brand should ideally be recognizable even if the logo is removed.

This can be achieved through:

* Typography
* ECG motif
* Grid system
* Accent color
* Spacing
* Technical labels
* Editorial composition

A strong visual identity should not depend entirely on a logo.

---

# 63. Logo Integration

Keep the logo simple.

Avoid oversized logos.

The logo should have enough whitespace around it.

Do not place the logo inside a giant colorful container.

---

# 64. Healthcare Credibility

Visual credibility comes from consistency.

Maintain:

```text
Consistent spacing
Consistent typography
Consistent icons
Consistent colors
Consistent borders
Consistent interaction
```

Small inconsistencies make a healthcare product feel unreliable.

---

# 65. Accessibility and Visual Design

Do not sacrifice accessibility for aesthetics.

Ensure:

* sufficient contrast
* readable font sizes
* visible focus states
* understandable status colors
* keyboard accessibility

The design should remain usable without relying on color alone.

---

# 66. AI Coding Instructions

When implementing this design, the AI must make design decisions based on **composition**, not on generic UI templates.

Before adding a visual element, ask:

```text
Does this improve hierarchy?
Does this improve comprehension?
Does this improve usability?
Does this reinforce the medical/scientific identity?
```

If the answer is no, do not add it.

---

# 67. Forbidden Visual Patterns

Avoid these unless specifically requested:

```text
❌ Purple-blue gradient backgrounds
❌ Neon cyan glow
❌ Neon purple glow
❌ Glassmorphism everywhere
❌ Floating gradient blobs
❌ 3D AI brain
❌ Robot illustrations
❌ Floating holographic panels
❌ Excessive rounded cards
❌ Giant pill buttons
❌ Excessive drop shadows
❌ Random decorative circles
❌ Excessive particles
❌ Generic AI illustrations
❌ Stock-photo doctor hero
❌ Every section centered
❌ Every section inside cards
❌ Gradient text everywhere
❌ Excessive animated elements
❌ "AI POWERED" repeated throughout the UI
```

---

# 68. Preferred Visual Patterns

Prefer:

```text
✓ Editorial typography
✓ Strong whitespace
✓ Thin borders
✓ Subtle neutral backgrounds
✓ Precise geometry
✓ Real ECG visualizations
✓ Scientific diagrams
✓ Medical instrumentation photography
✓ Technical metadata
✓ Asymmetric composition
✓ Restrained accent colors
✓ Data-driven visuals
✓ Subtle microinteractions
✓ Small technical labels
✓ Strong information hierarchy
✓ Carefully controlled motion
```

---

# 69. The "Designed, Not Generated" Test

After implementation, visually inspect every major section.

Ask:

> "Could this section have been generated by an AI website generator using a generic SaaS template?"

If the answer is yes, redesign it.

Specifically look for:

```text
Gradient hero
+
three cards
+
rounded buttons
+
floating blobs
+
centered text
+
generic illustration
```

If multiple sections follow this pattern, the design needs revision.

---

# 70. Final Art Direction

The final website should feel like:

```text
                    HEALTHCARE
                         +
                 MEDICAL SCIENCE
                         +
               DIGITAL INSTRUMENT
                         +
                  EDITORIAL DESIGN
                         +
                 MODERN SOFTWARE
```

Not:

```text
                 GENERIC AI STARTUP
                         +
                    GRADIENTS
                         +
                  GLOWING CARDS
                         +
                   AI ILLUSTRATIONS
```

The ECG itself should become one of the strongest visual assets.

The website should communicate technological sophistication through **precision and restraint**, not through visual effects.

---

# 71. Final Instruction

When generating or modifying the frontend:

> **Do not try to make the website look "AI futuristic." Make it look exceptionally well-designed.**

Use real medical/scientific visual language.

Use typography as a design element.

Use whitespace deliberately.

Use ECG signals as visual identity.

Use restrained colors.

Use precise geometry.

Use subtle motion.

Use real data visualizations.

Avoid visual clichés.

The final result should look like a **serious healthcare technology product designed by an experienced product designer**, rather than a collection of components assembled from an AI-generated SaaS template.
