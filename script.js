// Constants
const SPEED_OF_LIGHT = 299792458; // m/s
const METERS_TO_FEET = 3.28084;

// Material Velocity Factors
const VELOCITY_FACTORS = {
    copper_bare: 0.98,
    copper_insulated: 0.95,
    aluminum: 0.97
};

// Amateur Radio Bands (Frequency in MHz)
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

// State
let state = {
    frequency: 14.074,
    antennaType: 'vertical',
    unit: 'metric',
    material: 'copper_insulated',
    deferredPrompt: null
};

// DOM elements
let elements = {};

document.addEventListener('DOMContentLoaded', function () {
    initializeElements();
    setupEventListeners();
    registerServiceWorker();
    calculateAll();
});

function initializeElements() {
    elements = {
        frequency: document.getElementById('frequency'),
        antennaBtns: document.querySelectorAll('.antenna-btn'),
        antennaResults: document.querySelectorAll('.antenna-results'),
        unitToggle: document.getElementById('unit-toggle'),
        materialSelect: document.getElementById('material-select'),
        bandInfo: document.getElementById('band-info'),
        vfValue: document.getElementById('vf-value'),
        installBtn: document.getElementById('install-btn')
    };
}

function setupEventListeners() {
    elements.frequency.addEventListener('input', (e) => {
        state.frequency = parseFloat(e.target.value) || 0;
        calculateAll();
    });

    elements.antennaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.antennaType = btn.dataset.type;
            updateUI();
            calculateAll();

            // Auto-scroll to results on mobile/small screens
            const resultSection = document.getElementById(`${state.antennaType}-results`);
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (elements.unitToggle) {
        // Force update on unit toggle
        elements.unitToggle.addEventListener('change', (e) => {
            state.unit = e.target.checked ? 'imperial' : 'metric';
            console.log('Unit switched to:', state.unit);
            calculateAll();
        });
    }

    if (elements.materialSelect) {
        elements.materialSelect.addEventListener('change', (e) => {
            state.material = e.target.value;
            elements.vfValue.textContent = VELOCITY_FACTORS[state.material];
            calculateAll();
        });
    }

    // PWA Install Logic
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        if (elements.installBtn) {
            elements.installBtn.style.display = 'flex';
        }
    });

    if (elements.installBtn) {
        elements.installBtn.addEventListener('click', async () => {
            if (state.deferredPrompt) {
                state.deferredPrompt.prompt();
                const { outcome } = await state.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    elements.installBtn.style.display = 'none';
                }
                state.deferredPrompt = null;
            }
        });
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW failed', err));
    }
}

function updateUI() {
    elements.antennaBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === state.antennaType);
    });

    elements.antennaResults.forEach(res => {
        res.classList.toggle('active', res.id === `${state.antennaType}-results`);
    });
}

function calculateAll() {
    if (state.frequency <= 0) return;

    updateBandInfo();

    const vf = VELOCITY_FACTORS[state.material];
    const wavelength = SPEED_OF_LIGHT / (state.frequency * 1000000);

    switch (state.antennaType) {
        case 'vertical': calculateVertical(wavelength, vf); break;
        case 'dipole': calculateDipole(wavelength, vf); break;
        case 'yagi': calculateYagi(wavelength, vf); break;
        case 'quad': calculateQuad(wavelength, vf); break;
        case 'jpole': calculateJPole(wavelength, vf); break;
        case 'slimjim': calculateSlimJim(wavelength, vf); break;
        case 'invertedv': calculateInvertedV(wavelength, vf); break;
    }
}

function updateBandInfo() {
    const band = AMATEUR_BANDS.find(b => state.frequency >= b.min && state.frequency <= b.max);
    if (elements.bandInfo) {
        elements.bandInfo.textContent = band ? `Band: ${band.name}` : "Outside Amateur Bands";
        elements.bandInfo.className = band ? "band-badge valid" : "band-badge invalid";
    }
}

function calculateVertical(wavelength, vf) {
    const height = (wavelength / 4) * vf;
    const radial = (wavelength / 4) * 1.05; // Radials usually slightly longer

    setResult('vertical-height', height);
    setResult('vertical-ground', radial);
    setResult('vertical-impedance', '35-37 Ω');
    setResult('vertical-gain', '2.1 dBi');
    setResult('vertical-balun', 'Current Balun');
    setResult('vertical-balun-ratio', '1:1');
}

function calculateDipole(wavelength, vf) {
    const totalLength = (wavelength / 2) * vf;
    const sideLength = totalLength / 2;

    setResult('dipole-length', totalLength);
    setResult('dipole-side', sideLength);
    setResult('dipole-impedance', '72-73 Ω');
    setResult('dipole-gain', '2.15 dBi');
    setResult('dipole-balun', 'Current Balun');
    setResult('dipole-balun-ratio', '1:1');
}

function calculateYagi(wavelength, vf) {
    // Driven element is approx 0.475 * wavelength (already includes vf in practice, but we'll apply it)
    const driven = (wavelength / 2) * vf;
    const reflector = driven * 1.05;
    const director = driven * 0.95;
    const spacing = wavelength * 0.2;

    setResult('yagi-driven', driven);
    setResult('yagi-reflector', reflector);
    setResult('yagi-director', director);
    setResult('yagi-boom', spacing * 2);
    setResult('yagi-gain', '7-8 dBi');
    setResult('yagi-balun', 'Current Balun / Gamma Match');
    setResult('yagi-balun-ratio', '1:1');
}

function calculateQuad(wavelength, vf) {
    const perimeter = wavelength * 1.02 * vf; // Quad loops are slightly larger
    const side = perimeter / 4;

    setResult('quad-perimeter', perimeter);
    setResult('quad-side', side);
    setResult('quad-impedance', '100-120 Ω');
    setResult('quad-gain', '3.0 dBi');
    setResult('quad-balun', 'Voltage Balun');
    setResult('quad-balun-ratio', '2:1 / 4:1');
}

function calculateJPole(wavelength, vf) {
    const mainElement = (wavelength * 0.75) * vf;
    const matchingStub = (wavelength * 0.25) * vf;
    const gap = wavelength * 0.02;

    setResult('jpole-total', mainElement);
    setResult('jpole-stub', matchingStub);
    setResult('jpole-feed', matchingStub * 0.2); // Rough feed point from bottom
    setResult('jpole-impedance', '50 Ω');
}

function calculateSlimJim(wavelength, vf) {
    const perimeter = wavelength * vf;
    const totalHeight = (wavelength * 0.75) * vf;
    const gap = wavelength * 0.02;

    setResult('slimjim-total', totalHeight);
    setResult('slimjim-gap', gap);
    setResult('slimjim-impedance', '50 Ω');
}

function calculateInvertedV(wavelength, vf) {
    const totalLength = (wavelength / 2) * vf * 0.98; // Slightly shorter than dipole
    const sideLength = totalLength / 2;

    setResult('invertedv-length', totalLength);
    setResult('invertedv-side', sideLength);
    setResult('invertedv-impedance', '50-60 Ω');
}

function setResult(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (typeof value === 'number') {
        el.textContent = formatValue(value);
    } else {
        el.textContent = value;
    }
}

function formatValue(meters) {
    if (state.unit === 'metric') {
        if (meters >= 1) return `${meters.toFixed(3)} m`;
        return `${(meters * 100).toFixed(2)} cm`;
    } else {
        const feet = meters * METERS_TO_FEET;
        if (feet >= 1) {
            const wholeFeet = Math.floor(feet);
            const inches = (feet - wholeFeet) * 12;
            return `${wholeFeet}' ${inches.toFixed(1)}"`;
        }
        return `${(feet * 12).toFixed(2)}"`;
    }
}
