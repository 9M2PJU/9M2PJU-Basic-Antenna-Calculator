const SPEED_OF_LIGHT = 299792458;
const METERS_TO_FEET = 3.28084;
const METERS_TO_INCHES = METERS_TO_FEET * 12;
const MM_PER_INCH = 25.4;

const VELOCITY_FACTORS = {
    copper_bare: 0.98,
    copper_insulated: 0.95,
    aluminum: 0.97,
    ladder_line: 0.90
};

const BALANCED_LINE_WIRES = [
    { label: "18 AWG", diameterMm: 1.02 },
    { label: "16 AWG", diameterMm: 1.29 },
    { label: "14 AWG", diameterMm: 1.63 },
    { label: "12 AWG", diameterMm: 2.05 }
];

const AMATEUR_BANDS = [
    { name: "2200m", min: 0.135, max: 0.138 },
    { name: "630m", min: 0.472, max: 0.479 },
    { name: "160m", min: 1.8, max: 2.0 },
    { name: "80m", min: 3.5, max: 4.0 },
    { name: "60m", min: 5.33, max: 5.41 },
    { name: "40m", min: 7.0, max: 7.3 },
    { name: "30m", min: 10.1, max: 10.15 },
    { name: "20m", min: 14.0, max: 14.35 },
    { name: "17m", min: 18.068, max: 18.168 },
    { name: "15m", min: 21.0, max: 21.45 },
    { name: "12m", min: 24.89, max: 24.99 },
    { name: "10m", min: 28.0, max: 29.7 },
    { name: "6m", min: 50.0, max: 54.0 },
    { name: "4m", min: 70.0, max: 70.5 },
    { name: "2m", min: 144.0, max: 148.0 },
    { name: "1.25m", min: 222.0, max: 225.0 },
    { name: "70cm", min: 420.0, max: 450.0 },
    { name: "33cm", min: 902.0, max: 928.0 },
    { name: "23cm", min: 1240.0, max: 1300.0 }
];

const CATEGORIES = [
    { id: "wire", label: "Wire" },
    { id: "vertical", label: "Vertical" },
    { id: "beam", label: "Beam" },
    { id: "loop", label: "Loop" },
    { id: "matching", label: "Balun / Unun" },
    { id: "feedline", label: "Feedline / Stubs" }
];

let state = {
    frequency: 14.074,
    category: "wire",
    tool: "dipole",
    unit: "metric",
    material: "copper_insulated",
    coaxVf: 0.66,
    sourceZ: 50,
    loadZ: 450,
    balancedWireDiameter: 1.63,
    balancedSpacing: 34.7,
    balancedLength: 10,
    balancedVf: 0.95,
    deferredPrompt: null
};

let elements = {};

const tool = (id, category, title, type, visual, calculate) => ({ id, category, title, type, visual, calculate });

const TOOLS = [
    tool("dipole", "wire", "Center-Fed Dipole", "Antenna", "dipole", c => ({
        results: [
            r("Total length", c.wl * 0.5 * c.vf),
            r("Each leg", c.wl * 0.25 * c.vf),
            r("Typical feed Z", "50-75 ohms"),
            r("Balun / choke", "1:1 current balun")
        ],
        notes: ["Classic half-wave reference antenna. Start 2-5% long and trim both legs equally."]
    })),
    tool("invertedv", "wire", "Inverted V", "Antenna", "invertedv", c => ({
        results: [
            r("Total wire", c.wl * 0.5 * c.vf * 0.97),
            r("Each leg", c.wl * 0.25 * c.vf * 0.97),
            r("Included angle", "90-120 degrees"),
            r("Typical feed Z", "40-60 ohms")
        ],
        notes: ["Ends closer to ground lower impedance and resonance. Keep wire ends safely out of reach."]
    })),
    tool("ocf", "wire", "Off-Center-Fed Dipole", "Antenna", "ocf", c => {
        const total = c.wl * 0.5 * c.vf;
        return {
            results: [
                r("Total length", total),
                r("Short side", total * 0.33),
                r("Long side", total * 0.67),
                r("Matching", "4:1 current balun")
            ],
            notes: ["A 33/67 split is a common multiband starting point. Add a good common-mode choke below the balun."]
        };
    }),
    tool("efhw", "wire", "End-Fed Half-Wave", "Antenna", "endfed", c => ({
        results: [
            r("Radiator length", c.wl * 0.5 * c.vf),
            r("Counterpoise start", c.wl * 0.05 * c.vf),
            r("Transformer", "49:1 or 64:1 unun"),
            r("Feed impedance", "High, typically 2-5 kohms")
        ],
        notes: ["Good transformer winding and choking matter. Tune the wire on the lowest intended band first."]
    })),
    tool("folded-dipole", "wire", "Folded Dipole", "Antenna", "folded", c => ({
        results: [
            r("Overall length", c.wl * 0.5 * c.vf),
            r("Each side", c.wl * 0.25 * c.vf),
            r("Spacing guide", c.wl * 0.01),
            r("Matching", "4:1 balun to 50 ohms")
        ],
        notes: ["A folded dipole is broadband compared with a simple dipole and has roughly 280-300 ohm feed impedance."]
    })),
    tool("fan-dipole", "wire", "Fan Dipole Element", "Antenna", "fan", c => ({
        results: [
            r("Selected band pair", c.wl * 0.5 * c.vf),
            r("Each leg", c.wl * 0.25 * c.vf),
            r("Wire spread", c.wl * 0.015),
            r("Feed", "1:1 current balun")
        ],
        notes: ["Use this per band. Install longest dipole first, then add shorter elements and retune each band."]
    })),
    tool("random-wire", "wire", "Random Wire / Counterpoise", "Antenna", "endfed", c => ({
        results: [
            r("Quarter-wave avoid", c.wl * 0.25 * c.vf),
            r("Counterpoise start", c.wl * 0.05 * c.vf),
            r("Counterpoise option", c.wl * 0.25 * c.vf),
            r("Matching", "9:1 unun plus tuner")
        ],
        notes: ["Avoid exact half-wave multiples for easier tuner loading. Popular non-resonant wire lengths include 29, 35.5, 41, 58, 71, 84 and 107 ft."]
    })),
    tool("zepp", "wire", "Doublet / Zepp", "Antenna", "doublet", c => ({
        results: [
            r("Total top length", c.wl * 0.5 * c.vf),
            r("Each side", c.wl * 0.25 * c.vf),
            r("Open-wire feeder", c.wl * 0.25 * 0.9),
            r("Matching", "Balanced tuner / 1:1 balun")
        ],
        notes: ["A doublet with ladder line is a strong multiband choice. Keep the balanced line clear of metal."]
    })),
    tool("g5rv", "wire", "G5RV / ZS6BKW Reference", "Antenna", "doublet", () => ({
        results: [
            r("Classic G5RV top", "31.1 m / 102 ft"),
            r("G5RV matching line", "10.4 m / 34 ft"),
            r("ZS6BKW top", "28.4 m / 93 ft"),
            r("ZS6BKW line", "12.2 m / 40 ft")
        ],
        notes: ["These are reference multiband dimensions, not scaled to the frequency box. Use ladder line and a tuner-friendly feedline layout."]
    })),
    tool("t2fd", "wire", "T2FD / Terminated Folded Dipole", "Antenna", "t2fd", c => ({
        results: [
            r("Overall length", c.wl * 0.45 * c.vf),
            r("Spacing", c.wl * 0.015),
            r("Terminating resistor", "400-900 ohms non-inductive"),
            r("Matching", "9:1 or 12:1 balun")
        ],
        notes: ["T2FD antennas trade efficiency for bandwidth. Use a resistor rated for the expected RF power dissipation."]
    })),
    tool("beverage", "wire", "Beverage Receive Antenna", "RX Antenna", "beverage", c => ({
        results: [
            r("One wavelength", c.wl),
            r("Two wavelengths", c.wl * 2),
            r("Height guide", "1-3 m / 3-10 ft"),
            r("Termination", "400-600 ohms")
        ],
        notes: ["A Beverage is mainly for low-band receiving and needs space, ground, transformer matching and a termination resistor."]
    })),
    tool("quarter-vertical", "vertical", "Quarter-Wave Ground Plane", "Antenna", "vertical", c => ({
        results: [
            r("Radiator", c.wl * 0.25 * c.vf),
            r("Radials, each", c.wl * 0.25 * c.vf),
            r("Suggested radials", "4 elevated or many ground"),
            r("Feed Z", "35-50 ohms")
        ],
        notes: ["Elevated radials should be resonant. Ground-mounted radials can be shorter but use more of them."]
    })),
    tool("five-eighth", "vertical", "5/8-Wave Vertical", "Antenna", "vertical", c => ({
        results: [
            r("Radiator", c.wl * 0.625 * c.vf),
            r("Radials, each", c.wl * 0.25 * c.vf),
            r("Series matching coil", "Required"),
            r("Feed Z", "Not direct 50 ohms")
        ],
        notes: ["Common on VHF. The matching network is part of the antenna, so final dimensions need field tuning."]
    })),
    tool("discone", "vertical", "Discone", "Antenna", "discone", c => ({
        results: [
            r("Cone slant length", c.wl * 0.25 * c.vf),
            r("Disc radius", c.wl * 0.17 * c.vf),
            r("Cone angle", "60 degrees typical"),
            r("Bandwidth", "Wideband above design frequency")
        ],
        notes: ["Discones are broadband scanner/VHF/UHF antennas. Choose the lowest useful frequency, then build mechanically stiff."]
    })),
    tool("halfwave-vertical", "vertical", "Half-Wave Vertical", "Antenna", "endfed-vertical", c => ({
        results: [
            r("Radiator", c.wl * 0.5 * c.vf),
            r("Counterpoise start", c.wl * 0.05 * c.vf),
            r("Matching", "High-Z transformer"),
            r("Use case", "Portable end-fed vertical")
        ],
        notes: ["End-fed half-wave verticals need a transformer and choke. They are not simply coax-fed at the end."]
    })),
    tool("jpole", "vertical", "J-Pole", "Antenna", "jpole", c => ({
        results: [
            r("Long element", c.wl * 0.75 * c.vf),
            r("Matching stub", c.wl * 0.25 * c.vf),
            r("Feed tap start", c.wl * 0.025 * c.vf),
            r("Stub gap", c.wl * 0.01)
        ],
        notes: ["Slide the feed tap for best match. Add a choke below the feed point to control shield current."]
    })),
    tool("slimjim", "vertical", "Slim Jim", "Antenna", "slimjim", c => ({
        results: [
            r("Overall height", c.wl * 0.75 * c.vf),
            r("Half-wave section", c.wl * 0.5 * c.vf),
            r("Quarter-wave stub", c.wl * 0.25 * c.vf),
            r("Gap", c.wl * 0.015)
        ],
        notes: ["Often built from ladder line for VHF/UHF. Tap point and gap are construction-dependent."]
    })),
    tool("yagi3", "beam", "3-Element Yagi", "Antenna", "yagi", c => {
        const driven = c.wl * 0.475 * c.vf;
        return {
            results: [
                r("Reflector", driven * 1.05),
                r("Driven", driven),
                r("Director", driven * 0.95),
                r("Boom length", c.wl * 0.4)
            ],
            notes: ["Good starter dimensions only. Element diameter and boom coupling affect the final tuned lengths."]
        };
    }),
    tool("moxon", "beam", "Moxon Rectangle", "Antenna", "moxon", c => ({
        results: [
            r("Long side A", c.wl * 0.36 * c.vf),
            r("End section B", c.wl * 0.052 * c.vf),
            r("Gap C", c.wl * 0.018),
            r("Typical feed Z", "Near 50 ohms")
        ],
        notes: ["Moxon dimensions are sensitive to wire size. Use these as pre-cut values before calculator/model refinement."]
    })),
    tool("hb9cv", "beam", "HB9CV / 2-Element Beam", "Antenna", "yagi", c => ({
        results: [
            r("Reflector", c.wl * 0.5 * c.vf),
            r("Director", c.wl * 0.46 * c.vf),
            r("Element spacing", c.wl * 0.125),
            r("Phasing line", c.wl * 0.125 * c.coaxVf)
        ],
        notes: ["HB9CV antennas rely on phasing and matching. Keep the phasing line velocity factor accurate."]
    })),
    tool("turnstile", "beam", "Turnstile / Crossed Dipole", "Antenna", "dipole", c => ({
        results: [
            r("Each dipole", c.wl * 0.5 * c.vf),
            r("Each arm", c.wl * 0.25 * c.vf),
            r("Phase line", c.wl * 0.25 * c.coaxVf),
            r("Use case", "Satellite / circular polarization")
        ],
        notes: ["A turnstile uses two dipoles at right angles with 90-degree phasing. Keep the phasing harness symmetrical."]
    })),
    tool("quad2", "beam", "2-Element Quad", "Antenna", "quad", c => ({
        results: [
            r("Driven perimeter", c.wl * 1.02 * c.vf),
            r("Driven side", c.wl * 1.02 * c.vf / 4),
            r("Reflector perimeter", c.wl * 1.07 * c.vf),
            r("Spacing", c.wl * 0.15)
        ],
        notes: ["Feed impedance depends on spacing and reflector tuning. A 2:1 or 4:1 balun may be useful."]
    })),
    tool("full-loop", "loop", "Full-Wave Loop", "Antenna", "loop", c => ({
        results: [
            r("Loop perimeter", c.wl * 1.02 * c.vf),
            r("Square side", c.wl * 1.02 * c.vf / 4),
            r("Circle diameter", c.wl * 1.02 * c.vf / Math.PI),
            r("Feed Z", "100-120 ohms")
        ],
        notes: ["Shape and feed point change polarization and impedance. Use a 2:1 or 4:1 match if needed."]
    })),
    tool("delta-loop", "loop", "Delta Loop", "Antenna", "delta", c => ({
        results: [
            r("Perimeter", c.wl * 1.02 * c.vf),
            r("Each side", c.wl * 1.02 * c.vf / 3),
            r("Vertical height", c.wl * 1.02 * c.vf * Math.sqrt(3) / 6),
            r("Feed Z", "80-120 ohms")
        ],
        notes: ["Feed at bottom corner for vertical polarization or bottom center for horizontal polarization."]
    })),
    tool("small-loop", "loop", "Small Magnetic Loop", "Antenna", "loop", c => ({
        results: [
            r("Max circumference", c.wl * 0.1),
            r("Max diameter", c.wl * 0.1 / Math.PI),
            r("Typical circumference", c.wl * 0.07),
            r("Capacitor", "High voltage tuning cap")
        ],
        notes: ["This gives safe geometry ranges only. Efficiency and capacitance require conductor diameter, loop size and power."]
    })),
    tool("halo", "loop", "Halo / Squalo", "Antenna", "loop", c => ({
        results: [
            r("Loop circumference", c.wl * 0.5 * c.vf),
            r("Approx diameter", c.wl * 0.5 * c.vf / Math.PI),
            r("Feed gap", c.wl * 0.015),
            r("Use case", "Horizontal omni VHF")
        ],
        notes: ["Popular for 6m, 2m and mobile work. Matching gap and gamma details vary by build."]
    })),
    tool("eggbeater", "loop", "Eggbeater Satellite Antenna", "Antenna", "loop", c => ({
        results: [
            r("Each loop circumference", c.wl * c.vf),
            r("Loop diameter start", c.wl * c.vf / Math.PI),
            r("Phase line", c.wl * 0.25 * c.coaxVf),
            r("Use case", "LEO satellite work")
        ],
        notes: ["Eggbeaters use two loops with phasing for circular polarization. Final loop shape changes match and pattern."]
    })),
    tool("impedance-ratio", "matching", "Impedance Ratio", "Matching", "transformer", c => {
        const ratio = c.loadZ / c.sourceZ;
        return {
            results: [
                r("Impedance ratio", `${ratio.toFixed(2)}:1`),
                r("Turns ratio", `${Math.sqrt(ratio).toFixed(2)}:1`),
                r("Source Z", `${c.sourceZ.toFixed(0)} ohms`),
                r("Load Z", `${c.loadZ.toFixed(0)} ohms`)
            ],
            notes: ["Transformer turns ratio is the square root of impedance ratio. Use realistic core material for frequency and power."]
        };
    }),
    tool("common-ununs", "matching", "Common Balun / Unun Ratios", "Matching", "transformer", c => ({
        results: [
            r("1:1 current balun", "50 to 50 ohms"),
            r("4:1 balun", "200 to 50 ohms"),
            r("9:1 unun", "450 to 50 ohms"),
            r("49:1 unun", "2450 to 50 ohms")
        ],
        notes: ["Use 1:1 chokes for common-mode control. Use voltage/current transformers for impedance transformation."]
    })),
    tool("quarter-transformer", "matching", "Quarter-Wave Transformer", "Matching", "coax", c => ({
        results: [
            r("Required line Z", `${Math.sqrt(c.sourceZ * c.loadZ).toFixed(1)} ohms`),
            r("Physical quarter wave", c.wl * 0.25 * c.coaxVf),
            r("Source Z", `${c.sourceZ.toFixed(0)} ohms`),
            r("Load Z", `${c.loadZ.toFixed(0)} ohms`)
        ],
        notes: ["A quarter-wave transformer is narrowband and needs feedline with impedance near the calculated value."]
    })),
    tool("coax-choke", "matching", "Coax Choke Length Helper", "Matching", "coax", c => ({
        results: [
            r("Quarter-wave coax", c.wl * 0.25 * c.coaxVf),
            r("Half-wave coax", c.wl * 0.5 * c.coaxVf),
            r("One wavelength coax", c.wl * c.coaxVf),
            r("Preferred method", "Ferrite choke")
        ],
        notes: ["Coiled-coax chokes are build-dependent. Ferrite sleeve or toroid chokes are more predictable across a band."]
    })),
    tool("coax-length", "feedline", "Coax Electrical Length", "Feedline", "coax", c => ({
        results: [
            r("Quarter wave", c.wl * 0.25 * c.coaxVf),
            r("Half wave", c.wl * 0.5 * c.coaxVf),
            r("Three-quarter wave", c.wl * 0.75 * c.coaxVf),
            r("Full wave", c.wl * c.coaxVf)
        ],
        notes: ["Physical length equals electrical wavelength times coax velocity factor."]
    })),
    tool("balanced-line", "feedline", "Balanced Line Designer", "Feedline", "balanced", balancedLineDesign),
    tool("stub-short", "feedline", "Shorted Stub", "Stub", "stub", c => ({
        results: [
            r("1/8-wave shorted", c.wl * 0.125 * c.coaxVf),
            r("1/4-wave shorted", c.wl * 0.25 * c.coaxVf),
            r("1/2-wave shorted", c.wl * 0.5 * c.coaxVf),
            r("Coax VF", c.coaxVf.toFixed(2))
        ],
        notes: ["Shorted and open stubs transform impedance differently. Cut long and trim while measuring."]
    })),
    tool("stub-open", "feedline", "Open Stub", "Stub", "stub", c => ({
        results: [
            r("1/8-wave open", c.wl * 0.125 * c.coaxVf),
            r("1/4-wave open", c.wl * 0.25 * c.coaxVf),
            r("1/2-wave open", c.wl * 0.5 * c.coaxVf),
            r("Coax VF", c.coaxVf.toFixed(2))
        ],
        notes: ["Open stubs are affected by end capacitance. Final length is usually slightly shorter than calculated."]
    })),
    tool("swr-loss", "feedline", "SWR Mismatch Loss", "Reference", "meter", c => {
        const gamma = Math.abs((c.loadZ - c.sourceZ) / (c.loadZ + c.sourceZ));
        const swr = (1 + gamma) / (1 - gamma);
        const loss = -10 * Math.log10(1 - gamma * gamma);
        return {
            results: [
                r("Calculated SWR", `${swr.toFixed(2)}:1`),
                r("Reflection coeff.", gamma.toFixed(3)),
                r("Mismatch loss", `${loss.toFixed(2)} dB`),
                r("Assumes", "Pure resistance")
            ],
            notes: ["This ignores feedline attenuation and reactance. Real antenna impedance is complex, so use it as a quick reference."]
        };
    })
];

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    loadSavedState();
    renderCategories();
    renderToolList();
    setupEventListeners();
    registerServiceWorker();
    calculateAndRender();
});

function initializeElements() {
    elements = {
        frequency: document.getElementById("frequency"),
        materialSelect: document.getElementById("material-select"),
        coaxVf: document.getElementById("coax-vf"),
        sourceZ: document.getElementById("source-z"),
        loadZ: document.getElementById("load-z"),
        balancedLinePanel: document.getElementById("balanced-line-panel"),
        balancedWireDiameterLabel: document.getElementById("balanced-wire-diameter-label"),
        balancedWireDiameter: document.getElementById("balanced-wire-diameter"),
        balancedSpacingLabel: document.getElementById("balanced-spacing-label"),
        balancedSpacing: document.getElementById("balanced-spacing"),
        balancedLengthLabel: document.getElementById("balanced-length-label"),
        balancedLength: document.getElementById("balanced-length"),
        balancedVf: document.getElementById("balanced-vf"),
        unitToggle: document.getElementById("unit-toggle"),
        bandInfo: document.getElementById("band-info"),
        categoryTabs: document.getElementById("category-tabs"),
        toolList: document.getElementById("tool-list"),
        toolCategory: document.getElementById("tool-category"),
        toolTitle: document.getElementById("tool-title"),
        toolType: document.getElementById("tool-type"),
        toolVisual: document.getElementById("tool-visual"),
        resultGrid: document.getElementById("result-grid"),
        notesPanel: document.getElementById("notes-panel"),
        installBtn: document.getElementById("install-btn")
    };
}

function setupEventListeners() {
    elements.frequency.addEventListener("input", e => updateState("frequency", toNumber(e.target.value, 0)));
    elements.materialSelect.addEventListener("change", e => updateState("material", e.target.value));
    elements.coaxVf.addEventListener("input", e => updateState("coaxVf", clamp(toNumber(e.target.value, 0.66), 0.1, 1)));
    elements.sourceZ.addEventListener("input", e => updateState("sourceZ", Math.max(1, toNumber(e.target.value, 50))));
    elements.loadZ.addEventListener("input", e => updateState("loadZ", Math.max(1, toNumber(e.target.value, 450))));
    elements.balancedWireDiameter.addEventListener("input", e => updateState("balancedWireDiameter", readSmallLengthInput(e.target.value, state.balancedWireDiameter)));
    elements.balancedSpacing.addEventListener("input", e => updateState("balancedSpacing", readSmallLengthInput(e.target.value, state.balancedSpacing)));
    elements.balancedLength.addEventListener("input", e => updateState("balancedLength", readLineLengthInput(e.target.value, state.balancedLength)));
    elements.balancedVf.addEventListener("input", e => updateState("balancedVf", clamp(toNumber(e.target.value, 0.95), 0.5, 1)));
    elements.unitToggle.addEventListener("change", e => updateState("unit", e.target.checked ? "imperial" : "metric"));

    window.addEventListener("beforeinstallprompt", e => {
        e.preventDefault();
        state.deferredPrompt = e;
        elements.installBtn.hidden = false;
    });

    window.addEventListener("appinstalled", () => {
        state.deferredPrompt = null;
        elements.installBtn.hidden = true;
    });

    elements.installBtn.addEventListener("click", async () => {
        if (!state.deferredPrompt) return;
        state.deferredPrompt.prompt();
        await state.deferredPrompt.userChoice;
        state.deferredPrompt = null;
        elements.installBtn.hidden = true;
    });
}

function updateState(key, value) {
    state[key] = value;
    saveState();
    calculateAndRender();
}

function renderCategories() {
    elements.categoryTabs.innerHTML = CATEGORIES.map(category => (
        `<button class="category-btn ${category.id === state.category ? "active" : ""}" data-category="${category.id}">${category.label}</button>`
    )).join("");

    elements.categoryTabs.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            state.category = button.dataset.category;
            state.tool = TOOLS.find(item => item.category === state.category).id;
            saveState();
            renderCategories();
            renderToolList();
            calculateAndRender();
        });
    });
}

function renderToolList() {
    const tools = TOOLS.filter(item => item.category === state.category);
    elements.toolList.innerHTML = tools.map(item => (
        `<button class="tool-btn ${item.id === state.tool ? "active" : ""}" data-tool="${item.id}">
            <span>${item.title}</span>
            <small>${item.type}</small>
        </button>`
    )).join("");

    elements.toolList.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            state.tool = button.dataset.tool;
            saveState();
            renderToolList();
            calculateAndRender();
            if (window.matchMedia("(max-width: 840px)").matches) {
                document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function calculateAndRender() {
    syncControls();
    updateBandInfo();

    const selected = TOOLS.find(item => item.id === state.tool) || TOOLS[0];
    const category = CATEGORIES.find(item => item.id === selected.category);
    const context = createContext();
    const output = selected.calculate(context);

    elements.toolCategory.textContent = category ? category.label : selected.category;
    elements.toolTitle.textContent = selected.title;
    elements.toolType.textContent = selected.type;
    elements.toolVisual.innerHTML = visualSvg(selected.visual);
    elements.resultGrid.innerHTML = output.results.map(renderResult).join("");
    elements.notesPanel.innerHTML = `<h3>Build Notes</h3>${output.notes.map(note => `<p>${note}</p>`).join("")}`;
}

function createContext() {
    return {
        frequency: state.frequency,
        wl: SPEED_OF_LIGHT / (state.frequency * 1000000),
        vf: VELOCITY_FACTORS[state.material],
        coaxVf: state.coaxVf,
        sourceZ: state.sourceZ,
        loadZ: state.loadZ,
        balancedWireDiameter: state.balancedWireDiameter,
        balancedSpacing: state.balancedSpacing,
        balancedLength: state.balancedLength,
        balancedVf: state.balancedVf
    };
}

function syncControls() {
    elements.frequency.value = state.frequency || "";
    elements.materialSelect.value = state.material;
    elements.coaxVf.value = state.coaxVf;
    elements.sourceZ.value = state.sourceZ;
    elements.loadZ.value = state.loadZ;
    elements.balancedLinePanel.hidden = state.tool !== "balanced-line";
    elements.balancedWireDiameterLabel.textContent = state.unit === "imperial" ? "Wire Diameter (in)" : "Wire Diameter (mm)";
    elements.balancedSpacingLabel.textContent = state.unit === "imperial" ? "Center Spacing (in)" : "Center Spacing (mm)";
    elements.balancedLengthLabel.textContent = state.unit === "imperial" ? "Line Length (ft)" : "Line Length (m)";
    syncBalancedInputAttributes();
    elements.balancedWireDiameter.value = formatSmallInput(state.balancedWireDiameter);
    elements.balancedSpacing.value = formatSmallInput(state.balancedSpacing);
    elements.balancedLength.value = formatLineLengthInput(state.balancedLength);
    elements.balancedVf.value = state.balancedVf;
    elements.unitToggle.checked = state.unit === "imperial";
}

function syncBalancedInputAttributes() {
    const smallStep = state.unit === "imperial" ? "0.001" : "0.01";
    const spacingStep = state.unit === "imperial" ? "0.001" : "0.1";
    const smallMin = state.unit === "imperial" ? "0.001" : "0.1";
    const spacingMin = state.unit === "imperial" ? "0.001" : "0.2";

    elements.balancedWireDiameter.step = smallStep;
    elements.balancedWireDiameter.min = smallMin;
    elements.balancedSpacing.step = spacingStep;
    elements.balancedSpacing.min = spacingMin;
    elements.balancedLength.step = "0.01";
    elements.balancedLength.min = "0";
}

function updateBandInfo() {
    const band = AMATEUR_BANDS.find(band => state.frequency >= band.min && state.frequency <= band.max);
    elements.bandInfo.textContent = band ? `Band: ${band.name}` : "Outside common amateur bands";
    elements.bandInfo.className = band ? "band-badge valid" : "band-badge invalid";
}

function renderResult(item) {
    const value = typeof item.value === "number" ? formatLength(item.value) : item.value;
    const longClass = typeof value === "string" && value.length > 32 ? " long-value" : "";
    return `<div class="result-item">
        <span class="label">${item.label}</span>
        <span class="value${longClass}">${value}</span>
    </div>`;
}

function r(label, value) {
    return { label, value };
}

function balancedLineDesign(c) {
    const targetZ = clamp(c.loadZ, 75, 900);
    const diameterMm = Math.max(0.1, c.balancedWireDiameter);
    const spacingMm = Math.max(diameterMm * 1.01, c.balancedSpacing);
    const physicalLength = Math.max(0, c.balancedLength);
    const lineVf = clamp(c.balancedVf, 0.5, 1);
    const actualZ = balancedImpedance(spacingMm, diameterMm);
    const primaryWire = BALANCED_LINE_WIRES.find(wire => wire.label === "14 AWG");
    const primary = balancedSpacing(primaryWire.diameterMm, targetZ);
    const alternatives = BALANCED_LINE_WIRES.map(wire => {
        const spacing = balancedSpacing(wire.diameterMm, targetZ);
        return `${wire.label}: ${formatSmallLength(spacing.centerMeters)} holes`;
    }).join(" | ");
    const electricalLength = physicalLength / (c.wl * lineVf);
    const electricalDegrees = electricalLength * 360;
    const balun = balancedLineBalun(c.sourceZ, actualZ);

    return {
        results: [
            r("Target line Z", `${targetZ.toFixed(0)} ohms`),
            r("Your line Z", `${actualZ.toFixed(0)} ohms`),
            r("Wire diameter", formatSmallLength(diameterMm / 1000)),
            r("Center spacing", formatSmallLength(spacingMm / 1000)),
            r("Clear wire gap", formatSmallLength((spacingMm - diameterMm) / 1000)),
            r("Length entered", formatLength(physicalLength)),
            r("Electrical length", `${electricalLength.toFixed(3)} wavelength / ${electricalDegrees.toFixed(0)} deg`),
            r("1/4-wave line", c.wl * 0.25 * lineVf),
            r("1/2-wave line", c.wl * 0.5 * lineVf),
            r("Target with 14 AWG", `${formatSmallLength(primary.centerMeters)} holes`),
            r("Balun / tuner", balun),
            r("Other wire options", alternatives),
            r("Formula", "Z0 = 120 acosh(S / d)")
        ],
        notes: [
            "To design a line: set Source Z to the radio or tuner port, set Load Z to the balanced-line impedance you want, choose a wire diameter, then use the target spacing result as the center-to-center hole spacing in each spacer.",
            "To check a line you already built: enter its actual wire diameter and center spacing. Your line Z is calculated from those dimensions, and clear wire gap shows the air space between conductors.",
            "Length uses frequency and Line VF. Mostly air open-wire line is often near 0.95-0.99 VF; window/ladder line can be lower, so use the maker's VF when known.",
            "Balun choice depends on the whole antenna system. For balanced line into a balanced tuner, use no unun; for coax to balanced line, use a current balun, usually 1:1 for choking or 4:1 when the tuner wants a lower impedance.",
            "Keep balanced line away from metal, walls and soil. Bends, wet spacers and nearby objects change impedance and balance."
        ]
    };
}

function balancedImpedance(spacingMm, diameterMm) {
    return 120 * Math.acosh(spacingMm / diameterMm);
}

function balancedLineBalun(sourceZ, lineZ) {
    const ratio = lineZ / sourceZ;
    if (ratio < 2) return "1:1 current balun";
    if (ratio < 6) return "4:1 current balun";
    if (ratio < 12) return "balanced tuner + 4:1 current balun";
    return "balanced tuner preferred";
}

function balancedSpacing(diameterMm, impedance) {
    const diameterMeters = diameterMm / 1000;
    const centerMeters = diameterMeters * Math.cosh(impedance / 120);
    return {
        diameterMeters,
        centerMeters,
        gapMeters: Math.max(0, centerMeters - diameterMeters)
    };
}

function formatLength(meters) {
    if (!Number.isFinite(meters)) return "-";
    if (state.unit === "metric") {
        if (meters >= 1) return `${meters.toFixed(3)} m`;
        return `${(meters * 100).toFixed(2)} cm`;
    }

    const feet = meters * METERS_TO_FEET;
    if (feet >= 1) {
        const wholeFeet = Math.floor(feet);
        const inches = (feet - wholeFeet) * 12;
        return `${wholeFeet}' ${inches.toFixed(1)}"`;
    }
    return `${(feet * 12).toFixed(2)}"`;
}

function formatSmallLength(meters) {
    if (!Number.isFinite(meters)) return "-";
    if (state.unit === "metric") {
        if (meters >= 1) return `${meters.toFixed(3)} m`;
        const millimeters = meters * 1000;
        return `${millimeters < 10 ? millimeters.toFixed(2) : millimeters.toFixed(1)} mm`;
    }

    const inches = meters * METERS_TO_FEET * 12;
    if (inches >= 12) {
        const feet = Math.floor(inches / 12);
        return `${feet}' ${(inches - feet * 12).toFixed(2)}"`;
    }
    return `${inches < 1 ? inches.toFixed(3) : inches.toFixed(2)}"`;
}

function readSmallLengthInput(value, fallbackMm) {
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number)) return fallbackMm;
    const mm = state.unit === "imperial" ? number * MM_PER_INCH : number;
    return Math.max(0.1, mm);
}

function readLineLengthInput(value, fallbackMeters) {
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number)) return fallbackMeters;
    const meters = state.unit === "imperial" ? number / METERS_TO_FEET : number;
    return Math.max(0, meters);
}

function formatSmallInput(mm) {
    const value = state.unit === "imperial" ? mm / MM_PER_INCH : mm;
    return trimNumber(value, state.unit === "imperial" ? 4 : 2);
}

function formatLineLengthInput(meters) {
    const value = state.unit === "imperial" ? meters * METERS_TO_FEET : meters;
    return trimNumber(value, 2);
}

function trimNumber(value, digits) {
    if (!Number.isFinite(value)) return "";
    return Number(value.toFixed(digits)).toString();
}

function visualSvg(type) {
    const map = {
        dipole: `<svg viewBox="0 0 320 180"><line x1="160" y1="70" x2="34" y2="70"/><line x1="160" y1="70" x2="286" y2="70"/><circle cx="160" cy="70" r="8"/><path d="M160 78v70"/></svg>`,
        ocf: `<svg viewBox="0 0 320 180"><line x1="118" y1="70" x2="34" y2="70"/><line x1="118" y1="70" x2="286" y2="70"/><circle cx="118" cy="70" r="8"/><path class="feed" d="M118 78v70"/></svg>`,
        invertedv: `<svg viewBox="0 0 320 180"><line x1="160" y1="36" x2="52" y2="148"/><line x1="160" y1="36" x2="268" y2="148"/><circle cx="160" cy="36" r="8"/></svg>`,
        endfed: `<svg viewBox="0 0 320 180"><circle cx="48" cy="90" r="10"/><line x1="58" y1="90" x2="290" y2="42"/><path d="M48 100v46"/></svg>`,
        folded: `<svg viewBox="0 0 320 180"><rect x="42" y="52" width="236" height="42" rx="20"/><circle cx="160" cy="94" r="7"/><path d="M160 101v42"/></svg>`,
        t2fd: `<svg viewBox="0 0 320 180"><path d="M54 58h212v58H54Z"/><path class="secondary" d="M142 116h36"/><circle cx="160" cy="116" r="7"/><path class="feed" d="M160 123v28"/><path class="secondary" d="M248 58v58"/></svg>`,
        fan: `<svg viewBox="0 0 320 180"><circle cx="160" cy="78" r="8"/><line x1="160" y1="78" x2="36" y2="42"/><line x1="160" y1="78" x2="50" y2="96"/><line x1="160" y1="78" x2="284" y2="42"/><line x1="160" y1="78" x2="270" y2="96"/></svg>`,
        doublet: `<svg viewBox="0 0 320 180"><line x1="160" y1="56" x2="36" y2="56"/><line x1="160" y1="56" x2="284" y2="56"/><circle cx="160" cy="56" r="8"/><line class="feed" x1="148" y1="64" x2="148" y2="148"/><line class="feed" x1="172" y1="64" x2="172" y2="148"/></svg>`,
        beverage: `<svg viewBox="0 0 320 180"><line x1="46" y1="78" x2="278" y2="78"/><path class="secondary" d="M46 78v56M278 78v56"/><path class="secondary" d="M46 134h232"/><circle cx="46" cy="78" r="7"/><path class="feed" d="M46 85v48"/><path class="secondary" d="M278 64v28"/></svg>`,
        vertical: `<svg viewBox="0 0 320 180"><line x1="160" y1="28" x2="160" y2="140"/><circle cx="160" cy="140" r="8"/><line x1="160" y1="140" x2="60" y2="160"/><line x1="160" y1="140" x2="260" y2="160"/></svg>`,
        "endfed-vertical": `<svg viewBox="0 0 320 180"><line x1="160" y1="24" x2="160" y2="132"/><circle cx="160" cy="132" r="8"/><path class="feed" d="M160 140v28"/><line class="secondary" x1="160" y1="132" x2="78" y2="156"/><line class="secondary" x1="160" y1="132" x2="242" y2="156"/></svg>`,
        discone: `<svg viewBox="0 0 320 180"><line x1="160" y1="26" x2="160" y2="58"/><path d="M112 58h96"/><path d="M160 70 84 150"/><path d="M160 70l76 80"/><path d="M160 70v80"/><circle cx="160" cy="70" r="7"/></svg>`,
        jpole: `<svg viewBox="0 0 320 180"><path d="M145 20v138h38v-72"/><circle cx="164" cy="126" r="6"/></svg>`,
        slimjim: `<svg viewBox="0 0 320 180"><rect x="132" y="24" width="56" height="132" rx="20"/><path d="M132 78h56"/><circle cx="160" cy="126" r="6"/></svg>`,
        yagi: `<svg viewBox="0 0 320 180"><line x1="42" y1="90" x2="278" y2="90"/><line x1="72" y1="34" x2="72" y2="146"/><line x1="160" y1="44" x2="160" y2="136"/><line x1="248" y1="56" x2="248" y2="124"/></svg>`,
        moxon: `<svg viewBox="0 0 320 180"><path d="M52 54h78v42h-28"/><path d="M268 54h-78v42h28"/><line x1="160" y1="96" x2="160" y2="144"/></svg>`,
        quad: `<svg viewBox="0 0 320 180"><rect x="84" y="28" width="152" height="122" rx="4"/><circle cx="160" cy="150" r="7"/></svg>`,
        loop: `<svg viewBox="0 0 320 180"><circle cx="160" cy="88" r="64"/><circle cx="160" cy="152" r="7"/></svg>`,
        delta: `<svg viewBox="0 0 320 180"><path d="M160 28 58 150h204Z"/><circle cx="160" cy="150" r="7"/></svg>`,
        transformer: `<svg viewBox="0 0 320 180"><path d="M46 90h80"/><path d="M194 90h80"/><path d="M126 58c28 0 28 64 0 64"/><path d="M194 58c-28 0-28 64 0 64"/></svg>`,
        coax: `<svg viewBox="0 0 320 180"><path d="M38 92c48-60 92 60 140 0s88 20 104 0"/><path d="M38 122c48-60 92 60 140 0s88 20 104 0"/></svg>`,
        balanced: `<svg viewBox="0 0 320 180"><line x1="38" y1="68" x2="282" y2="68"/><line x1="38" y1="112" x2="282" y2="112"/><path class="spacer" d="M84 48v84M160 48v84M236 48v84"/><circle class="hole" cx="84" cy="68" r="5"/><circle class="hole" cx="84" cy="112" r="5"/><circle class="hole" cx="160" cy="68" r="5"/><circle class="hole" cx="160" cy="112" r="5"/><circle class="hole" cx="236" cy="68" r="5"/><circle class="hole" cx="236" cy="112" r="5"/></svg>`,
        stub: `<svg viewBox="0 0 320 180"><path d="M42 90h130"/><path d="M172 90v70"/><path d="M172 160h44"/><path d="M172 90h106"/></svg>`,
        meter: `<svg viewBox="0 0 320 180"><path d="M88 132a72 72 0 0 1 144 0"/><path d="M160 132l48-54"/><circle cx="160" cy="132" r="8"/></svg>`
    };
    return enhanceDiagram(map[type] || map.dipole);
}

function enhanceDiagram(svg) {
    const defs = `<defs>
        <linearGradient id="conductor-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6ee7b7"/>
            <stop offset="50%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <filter id="technical-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#34d399" flood-opacity="0.28"/>
        </filter>
    </defs>`;

    return svg
        .replace("<svg ", `<svg class="diagram" role="img" `)
        .replace(">", `>${defs}`);
}

function saveState() {
    localStorage.setItem("antennaCalculatorState", JSON.stringify({
        frequency: state.frequency,
        category: state.category,
        tool: state.tool,
        unit: state.unit,
        material: state.material,
        coaxVf: state.coaxVf,
        sourceZ: state.sourceZ,
        loadZ: state.loadZ,
        balancedWireDiameter: state.balancedWireDiameter,
        balancedSpacing: state.balancedSpacing,
        balancedLength: state.balancedLength,
        balancedVf: state.balancedVf
    }));
}

function loadSavedState() {
    try {
        const saved = JSON.parse(localStorage.getItem("antennaCalculatorState"));
        if (!saved) return;
        state = { ...state, ...saved };
        if (!TOOLS.some(item => item.id === state.tool)) state.tool = "dipole";
        const selected = TOOLS.find(item => item.id === state.tool);
        state.category = selected ? selected.category : "wire";
    } catch {
        saveState();
    }
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
}

function toNumber(value, fallback) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
