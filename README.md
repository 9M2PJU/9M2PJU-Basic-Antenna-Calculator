# 9M2PJU Antenna Calculator

A responsive, installable amateur radio antenna toolkit for quick field and shack calculations.

Live view: https://antenna.hamradio.my

## Features

- Wire antennas: dipole, inverted V, OCF dipole, EFHW, folded dipole, fan dipole element, random wire, doublet/Zepp, G5RV/ZS6BKW reference, T2FD and Beverage receive antenna.
- Verticals: quarter-wave ground plane, 5/8-wave vertical, half-wave vertical, discone, J-Pole and Slim Jim.
- Beams: 3-element Yagi, Moxon, HB9CV, turnstile/crossed dipole and 2-element quad.
- Loops: full-wave loop, delta loop, small magnetic loop geometry, halo/squalo and eggbeater.
- Matching tools: impedance ratio, common balun/unun ratios, quarter-wave transformer and coax choke length helper.
- Feedline and stubs: coax electrical lengths, open stubs, shorted stubs and SWR mismatch loss.
- Metric/imperial output, amateur-band detection, material velocity factor, coax velocity factor and saved preferences.
- PWA support with install prompt, offline cache, old-cache cleanup and navigation fallback.

## Running

Open `index.html` directly, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Calculation Notes

The app gives practical starting dimensions, not guaranteed final build dimensions. Antenna resonance and impedance depend on height, ground, wire diameter, nearby objects, feedline, construction style and weatherproofing.

For transmit antennas, start slightly long, install the antenna in its final position, then trim or adjust while measuring with an antenna analyzer or SWR meter.

## Files

```text
index.html      Main application markup
styles.css      Responsive desktop/mobile styling
script.js       Calculator definitions, formulas and PWA install logic
manifest.json   PWA manifest
sw.js           Service worker and offline cache
logo.png        App icon
```

## License

MIT
