# BRIEF: PEP SCHEP shades shop

**Self-authored under explicit creative delegation.** The user chose "Use your
judgment". Decisions below marked *(user)* are the user's own answers; the rest
are authored.

## The request, verbatim *(user)*

> I want to build a high converting webshop that looks very clean and
> professional using these shades: rave-classic, el-silencio, sinix,
> cristal-gris, calora, lunares, tecna (pep-schep.nl/shop/...)

- Scope *(user)*: standalone front-end site. Checkout hands off to pep-schep.nl.
- Aesthetic *(user)*: editorial / fashion.
- Assets *(user)*: both. Real product photos for product pages, generated
  lifestyle and hero imagery.
- Direction *(user)*: "Use your judgment".

## Evidence vs assumption

pep-schep.nl is blocked by this environment's network policy, and no
`KIE_AI_API_KEY` is set. Facts come only from search-result snippets:

| Model | Verified | Unverified (fill in `products.json`) |
|---|---|---|
| Rave Classic | thin black frame, sharp straight lines, minimal but bold; festival, city, terrace | price, lens colour, photos |
| El Silencio | price €19,95 | everything else |
| Sinix | €19,95; Y2K racer, narrow swept lines, deep dark lens, low nose bridge, light close wrap fit | photos |
| Cristal Gris | nothing (grey tint inferred from the name only) | everything |
| Calora | transparent frame, light-blue lenses, "fresh, goes with everything" | price, photos |
| Lunares | nothing | everything |
| Tecna | nothing | everything |

Brand-level, from pep-schep.nl snippets: UV-filter lenses, a storage case comes
standard, light frames, discreet packaging, affordable so a lost pair at a
festival does not hurt. **No invented numbers:** no ratings, review counts,
stock counters or "sold" figures anywhere.

## The eight topics (authored)

1. **Vibe:** sun-bleached festival editorial. References: the colour of a
   late-afternoon main stage; *The Face* magazine spreads; the tinted rear
   window of a tour bus.
2. **Journey:** open on the product as a magazine cover; look *through* the
   glasses; browse the seven as a fashion spread; learn what you get; choose.
3. **Energy:** calm cover, loud peak, calm grid, firm promise, confident close.
4. **Feeling / one moment:** see the peak below.
5. **The thing no other site does:** you look at the festival through each
   pair of lenses before you pick one.
6. **Distance from premium-minimal:** editorial. Warm paper canvas, a
   serif display face, asymmetric grids, one hot accent. Clean, not sterile.
7. **One world or distinct scenes:** distinct spreads, like turning pages.
8. **Assets:** none reachable yet. Image slots per product (`img/<slug>/`) and
   for the hero (`img/hero/`). Honest fallbacks: a drawn frame in the model's
   known tint, labelled "Foto volgt".

## Journey

1. Recognition: *this is a fashion piece, not a festival gimmick* (cover)
2. Turn: *I can see what each lens does* (Door het glas, the peak)
3. Range: *seven distinct characters, one is mine* (collection spread)
4. Substance: *it is cheap to lose and still properly made* (the promise)
5. Commitment: *pick one* (close)

Primary action label, used everywhere: **In mijn tas**.

## Feeling curve

| Act | Feeling | Cause on screen |
|---|---|---|
| Cover | Curiosity, cool | Split serif headline wrapped around a floating pair; lens light drifts in front as you scroll |
| Door het glas | Delight (PEAK) | A lens-shaped loupe follows your pointer over a festival scene, re-tinted per model |
| Collectie | Calm confidence | Asymmetric spread, each model revealed with a clip wipe, price and quick-add visible |
| Belofte | Reassurance | Four short facts land one by one while the frame holds |
| Kies je glas | Resolve | Seven tint swatches as the last choice, bag one click away |

**The peak:** "Je kijkt door elke bril naar het festival voordat je kiest."
Lives in act 2 and gets the most scroll room.

**Tell-someone sentence:** "It's the site where you look at the festival
through every pair before you buy one."

**Authored silence:** none. The quiet act before the peak is the cover itself.

## Grammar, signature, gate

- **Grammar:** editorial issue. Nav is a masthead with an issue line; acts are
  spreads; the close is a final spread, not a footer. Bans: no scrubbed video,
  no full-page pinning except the short promise act, no centred copy stacks.
  Filmic one-shot lost (no footage, and a shop needs browsing, not a film);
  gallery lost (it would bury the peak); working surface lost (too tool-like
  for fashion); the other grammars lost on length or on burying price.
- **Signature move:** *Door het glas* (bespoke page JS, `js/site.js`).
- **Fingerprint gate:** the registry was empty. First build, nothing to clear.

## Score

| Beat | Device | Why |
|---|---|---|
| Cover | layered parallax + pointer depth | Depth from planes is the premium signal; the product sits between type planes |
| Door het glas | pointer loupe (signature) | Turns the lens colour into the thing you experience |
| Collectie | clip-path reveal | Each model arrives as its own page turn |
| Belofte | short sticky + kinetic type | Four facts, one at a time, frame held still |
| Kies je glas | pointer (tint picks) | The page stops moving and waits for a choice |

Four device families, none twice in a row, zero scrubbed video.
