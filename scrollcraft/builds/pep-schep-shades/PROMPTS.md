# Image prompts: PEP SCHEP shades shop

26 images. Each filename is the path the site reads, so after saving the files,
`node build.mjs` picks them up.

## Rules for every image

1. **Always attach the real product photo as a reference** for any image that
   shows a pair of glasses (`--ref`, or an image upload in ChatGPT or Midjourney). The model
   must copy the actual frame and lens, not invent one. Throw away any result where the
   shape, colour or bridge differs from the real pair.
2. **Paste the style preamble unchanged at the top of every prompt.** Reusing the same
   preamble keeps 26 separate generations looking like one photo shoot.
3. No text, logos or prices in the images. The site adds those as real text.
4. Check every result before using it: correct glasses, clean hands, no extra frames,
   and the negative space where the prompt asks for it.

### Style preamble (copy verbatim)

```
Photoreal editorial fashion photograph for a Dutch festival-sunglasses brand. Warm, sun-bleached palette: off-white paper (#F2EDE4), sand, apricot and dusty rose, with deep plum shadows. Soft natural light, gentle film grain, true-to-life colour, crisp focus on the sunglasses. Clean, uncluttered, magazine-style composition with generous negative space. No text, no logos, no watermarks, no brand names, no extra accessories.
```

---

## 1. Home page cover (3 images)

The cover is built from layers: a background, a pair of glasses floating between
two headlines, and a foreground. The background must be a **clean plate**: no glasses
and no people, and light enough for dark headline text on the top left and bottom right.

### `img/hero/bg.jpg`: desktop background, 16:9, 2560×1440

```
[PREAMBLE]

High-key, sun-bleached festival atmosphere with no people and no objects in focus. A huge low sun glows in the upper right, dissolving into soft apricot and peach haze. The rest of the frame is very light warm off-white mist, almost paper-white in the upper left and lower right. Faint out-of-focus hints of festival flags and a stage truss far away on the horizon, extremely blurred. Airy, calm, overexposed like a summer afternoon. Leave the upper-left third and lower-right quarter nearly empty and light for dark overlaid text.
```
`--ar 16:9`

### `img/hero/bg-m.jpg`: mobile background, 9:16, 1080×1920

```
[PREAMBLE]

Same scene as a tall portrait frame: high-key sun-bleached festival haze with no people. The low sun glows in the upper right corner and fades into peach mist. The top third and the band just below the centre are very light off-white for dark overlaid text. Very faint blurred festival flags on a distant horizon line in the lower third.
```
`--ar 9:16`

### `img/hero/subject.png`: Calora, front view, to cut out, 3:2, 3000×2000

```
[PREAMBLE]

Product photograph of the sunglasses in the reference image: a transparent clear frame with light-blue tinted lenses. Straight-on front view, very slightly from below, temples opened and angled back, floating in the air with no hands or stand. Placed on a seamless flat mid-grey (#9A9A9A) background with even soft light and no cast shadow, so it can be cut out cleanly. The frame edges are razor sharp and a soft warm reflection of sunlight sits in the lenses. The glasses fill 80% of the width.
```
`--ar 3:2 --ref calora.jpg`

Afterwards, cut out the background into a PNG with a real transparent background. The frame is
transparent, so mask it by hand or with a matting tool rather than a quick background removal,
or the clear frame will disappear. The site adds its own shadow.

---

## 2. The "Door het glas" scene (1 image)

### `img/scene/scene.jpg`: 16:10, 2560×1600

This is the image visitors look at through each lens, so it has to be **bright
and colourful**. Otherwise the dark lenses have nothing to darken.

```
[PREAMBLE]

Wide shot of an open-air summer festival main field at golden hour, seen from the back of the crowd. A large low sun sits left of centre just above a soft hill line, flaring warm. On the right, a modern main stage with a truss roof, a row of warm spotlights and thin turquoise, pink and pale-yellow laser beams fanning up into a peach-to-rose sky. The lower third is a dense crowd seen from behind in silhouette, some arms raised, a few colourful festival flags on poles. No readable faces, no signage, no text. Vivid but natural colour, high dynamic range, sky bright and saturated.
```
`--ar 16:10`

---

## 3. Product photos (7 models × 3 images)

The first file (`01`) is the main image on the collection page and on the product
page. The site crops it to 4:5, 5:4 or 4:3, so **keep the glasses centred with
space all around** (about 70% of the width).

### Shared shot templates

**`01-front.jpg`: packshot, 4:5, 2000×2500**
```
[PREAMBLE]

Studio product photograph of the sunglasses in the reference image, reproduced exactly: same frame shape, frame colour, lens colour and bridge. [MODEL LINE]. Front view, temples opened and angled slightly back, resting on nothing, centred with generous space around it, filling about 70% of the frame width. Seamless warm off-white paper backdrop (#F2EDE4) with a soft sun-like key light from the upper right and a gentle, soft contact shadow below. A warm highlight glides across the lenses.
```
`--ar 4:5 --ref <model>.jpg`

**`02-angle.jpg`: three-quarter view, 4:3, 2400×1800**
```
[PREAMBLE]

Studio product photograph of the sunglasses in the reference image, reproduced exactly. [MODEL LINE]. Three-quarter view from the left, temples folded open, lying on warm sand-coloured stone with a hard late-afternoon shadow falling to the right, showing the side profile and temple shape. Centred, filling about 65% of the width.
```
`--ar 4:3 --ref <model>.jpg`

**`03-worn.jpg`: worn on a face, 4:5, 2000×2500**
```
[PREAMBLE]

Editorial portrait of an adult in their twenties wearing the sunglasses from the reference image, reproduced exactly. [MODEL LINE]. [SETTING LINE]. Chest-up framing, face turned three-quarters toward the light, the sunglasses sharp and clearly visible, the background softly out of focus. Natural skin texture, relaxed and confident expression, no posed smile.
```
`--ar 4:5 --ref <model>.jpg`

### Fill-ins per model

Replace `[MODEL LINE]` and `[SETTING LINE]` with the lines below. Where the lens colour
**has not been confirmed**, the line says "match the reference". Never guess it.

| Folder | `[MODEL LINE]` | `[SETTING LINE]` (03-worn) |
|---|---|---|
| `img/sinix/` | Slim Y2K-racer wraparound sunglasses with narrow swept-back lines, one continuous deep dark lens, a low nose bridge and a close, light fit | Sunrise at the edge of a festival field after an all-night set, blue-pink dawn light behind, a hint of laser haze |
| `img/calora/` | Sunglasses with a transparent clear frame and light-blue tinted lenses, fresh and light | Bright midday at a lakeside festival, glittering water and pale sky behind, cool fresh light |
| `img/rave-classic/` | Minimal but bold sunglasses with a thin black frame and sharp straight rectangular lines; lens colour matching the reference | A sunny city café terrace in the late afternoon, warm stone walls behind |
| `img/el-silencio/` | Sunglasses matching the reference exactly in frame shape, frame colour and lens colour | A quiet moment away from the crowd at golden hour, sitting on a grassy hill above the festival, calm and still |
| `img/cristal-gris/` | Sunglasses matching the reference exactly; frame and lens colour as in the reference (do not assume grey) | Hazy late-afternoon light between festival tents, soft silver-beige tones |
| `img/lunares/` | Sunglasses matching the reference exactly in frame shape, frame colour and lens colour | A dancing moment in front of a festival stage at golden hour, confetti drifting out of focus |
| `img/tecna/` | Sunglasses matching the reference exactly in frame shape, frame colour and lens colour | Under a techno tent at dusk, rim-lit by one warm spotlight, deep plum shadows |

---

## 4. Social share image (1 image)

### `img/og.jpg`: link preview, 1.91:1, 1200×630

```
[PREAMBLE]

Flat-lay of seven different pairs of sunglasses from the reference images, each reproduced exactly, arranged in a loose diagonal row on warm off-white paper (#F2EDE4) with long late-afternoon shadows. Even spacing, all pairs clearly visible, the left third kept emptier for a title overlay.
```
`--ar 1.91:1 --ref <all seven>.jpg`

(The site does not link this image yet. Add `<meta property="og:image">` when it exists.)

---

## Checklist

| # | File | Ratio | Reference |
|---|---|---|---|
| 1 | `img/hero/bg.jpg` | 16:9 | none |
| 2 | `img/hero/bg-m.jpg` | 9:16 | none |
| 3 | `img/hero/subject.png` | 3:2, cut out | Calora |
| 4 | `img/scene/scene.jpg` | 16:10 | none |
| 5–25 | `img/<model>/01-front.jpg`, `02-angle.jpg`, `03-worn.jpg` | 4:5, 4:3, 4:5 | that model |
| 26 | `img/og.jpg` | 1.91:1 | all seven |

The build does not use `bg-m.jpg` yet: when it exists, it needs one line in the
mobile CSS to replace the desktop background.
