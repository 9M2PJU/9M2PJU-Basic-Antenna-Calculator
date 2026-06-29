const SPEED_OF_LIGHT = 299792458;
const METERS_TO_FEET = 3.28084;

const VELOCITY_FACTORS = {
    copper_bare: 0.98,
    copper_insulated: 0.95,
    aluminum: 0.97,
    ladder_line: 0.90
};

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
    tool("ocf", "wire", "Off-Center-Fed Dipole", "Antenna", "dipole", c => {
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
    tool("zepp", "wire", "Doublet / Zepp", "Antenna", "dipole", c => ({
        results: [
            r("Total top length", c.wl * 0.5 * c.vf),
            r("Each side", c.wl * 0.25 * c.vf),
            r("Open-wire feeder", c.wl * 0.25 * 0.9),
            r("Matching", "Balanced tuner / 1:1 balun")
        ],
        notes: ["A doublet with ladder line is a strong multiband choice. Keep the balanced line clear of metal."]
    })),
    tool("g5rv", "wire", "G5RV / ZS6BKW Reference", "Antenna", "dipole", () => ({
        results: [
            r("Classic G5RV top", "31.1 m / 102 ft"),
            r("G5RV matching line", "10.4 m / 34 ft"),
            r("ZS6BKW top", "28.4 m / 93 ft"),
            r("ZS6BKW line", "12.2 m / 40 ft")
        ],
        notes: ["These are reference multiband dimensions, not scaled to the frequency box. Use ladder line and a tuner-friendly feedline layout."]
    })),
    tool("t2fd", "wire", "T2FD / Terminated Folded Dipole", "Antenna", "folded", c => ({
        results: [
            r("Overall length", c.wl * 0.45 * c.vf),
            r("Spacing", c.wl * 0.015),
            r("Terminating resistor", "400-900 ohms non-inductive"),
            r("Matching", "9:1 or 12:1 balun")
        ],
        notes: ["T2FD antennas trade efficiency for bandwidth. Use a resistor rated for the expected RF power dissipation."]
    })),
    tool("beverage", "wire", "Beverage Receive Antenna", "RX Antenna", "endfed", c => ({
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
    tool("discone", "vertical", "Discone", "Antenna", "vertical", c => ({
        results: [
            r("Cone slant length", c.wl * 0.25 * c.vf),
            r("Disc radius", c.wl * 0.17 * c.vf),
            r("Cone angle", "60 degrees typical"),
            r("Bandwidth", "Wideband above design frequency")
        ],
        notes: ["Discones are broadband scanner/VHF/UHF antennas. Choose the lowest useful frequency, then build mechanically stiff."]
    })),
    tool("halfwave-vertical", "vertical", "Half-Wave Vertical", "Antenna", "vertical", c => ({
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
        loadZ: state.loadZ
    };
}

function syncControls() {
    elements.frequency.value = state.frequency || "";
    elements.materialSelect.value = state.material;
    elements.coaxVf.value = state.coaxVf;
    elements.sourceZ.value = state.sourceZ;
    elements.loadZ.value = state.loadZ;
    elements.unitToggle.checked = state.unit === "imperial";
}

function updateBandInfo() {
    const band = AMATEUR_BANDS.find(band => state.frequency >= band.min && state.frequency <= band.max);
    elements.bandInfo.textContent = band ? `Band: ${band.name}` : "Outside common amateur bands";
    elements.bandInfo.className = band ? "band-badge valid" : "band-badge invalid";
}

function renderResult(item) {
    return `<div class="result-item">
        <span class="label">${item.label}</span>
        <span class="value">${typeof item.value === "number" ? formatLength(item.value) : item.value}</span>
    </div>`;
}

function r(label, value) {
    return { label, value };
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

function visualSvg(type) {
    const map = {
        dipole: `<svg viewBox="0 0 320 180"><line x1="160" y1="70" x2="34" y2="70"/><line x1="160" y1="70" x2="286" y2="70"/><circle cx="160" cy="70" r="8"/><path d="M160 78v70"/></svg>`,
        invertedv: `<svg viewBox="0 0 320 180"><line x1="160" y1="36" x2="52" y2="148"/><line x1="160" y1="36" x2="268" y2="148"/><circle cx="160" cy="36" r="8"/></svg>`,
        endfed: `<svg viewBox="0 0 320 180"><circle cx="48" cy="90" r="10"/><line x1="58" y1="90" x2="290" y2="42"/><path d="M48 100v46"/></svg>`,
        folded: `<svg viewBox="0 0 320 180"><rect x="42" y="52" width="236" height="42" rx="20"/><circle cx="160" cy="94" r="7"/><path d="M160 101v42"/></svg>`,
        fan: `<svg viewBox="0 0 320 180"><circle cx="160" cy="78" r="8"/><line x1="160" y1="78" x2="36" y2="42"/><line x1="160" y1="78" x2="50" y2="96"/><line x1="160" y1="78" x2="284" y2="42"/><line x1="160" y1="78" x2="270" y2="96"/></svg>`,
        vertical: `<svg viewBox="0 0 320 180"><line x1="160" y1="28" x2="160" y2="140"/><circle cx="160" cy="140" r="8"/><line x1="160" y1="140" x2="60" y2="160"/><line x1="160" y1="140" x2="260" y2="160"/></svg>`,
        jpole: `<svg viewBox="0 0 320 180"><path d="M145 20v138h38v-72"/><circle cx="164" cy="126" r="6"/></svg>`,
        slimjim: `<svg viewBox="0 0 320 180"><rect x="132" y="24" width="56" height="132" rx="20"/><path d="M132 78h56"/><circle cx="160" cy="126" r="6"/></svg>`,
        yagi: `<svg viewBox="0 0 320 180"><line x1="42" y1="90" x2="278" y2="90"/><line x1="72" y1="34" x2="72" y2="146"/><line x1="160" y1="44" x2="160" y2="136"/><line x1="248" y1="56" x2="248" y2="124"/></svg>`,
        moxon: `<svg viewBox="0 0 320 180"><path d="M52 54h78v42h-28"/><path d="M268 54h-78v42h28"/><line x1="160" y1="96" x2="160" y2="144"/></svg>`,
        quad: `<svg viewBox="0 0 320 180"><rect x="84" y="28" width="152" height="122" rx="4"/><circle cx="160" cy="150" r="7"/></svg>`,
        loop: `<svg viewBox="0 0 320 180"><circle cx="160" cy="88" r="64"/><circle cx="160" cy="152" r="7"/></svg>`,
        delta: `<svg viewBox="0 0 320 180"><path d="M160 28 58 150h204Z"/><circle cx="160" cy="150" r="7"/></svg>`,
        transformer: `<svg viewBox="0 0 320 180"><path d="M46 90h80"/><path d="M194 90h80"/><path d="M126 58c28 0 28 64 0 64"/><path d="M194 58c-28 0-28 64 0 64"/></svg>`,
        coax: `<svg viewBox="0 0 320 180"><path d="M38 92c48-60 92 60 140 0s88 20 104 0"/><path d="M38 122c48-60 92 60 140 0s88 20 104 0"/></svg>`,
        stub: `<svg viewBox="0 0 320 180"><path d="M42 90h130"/><path d="M172 90v70"/><path d="M172 160h44"/><path d="M172 90h106"/></svg>`,
        meter: `<svg viewBox="0 0 320 180"><path d="M88 132a72 72 0 0 1 144 0"/><path d="M160 132l48-54"/><circle cx="160" cy="132" r="8"/></svg>`
    };
    return map[type] || map.dipole;
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
        loadZ: state.loadZ
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
