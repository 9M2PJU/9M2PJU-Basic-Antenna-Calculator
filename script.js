// Constants
const SPEED_OF_LIGHT = 299792458; // m/s
const VELOCITY_FACTOR = 0.95; // Typical for wire antennas

// DOM elements
let frequencyInput, antennaButtons, antennaResults;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    calculateAll(); // Initial calculation
});

function initializeElements() {
    frequencyInput = document.getElementById('frequency');
    antennaButtons = document.querySelectorAll('.antenna-btn');
    antennaResults = document.querySelectorAll('.antenna-results');
}

function setupEventListeners() {
    // Frequency input change
    frequencyInput.addEventListener('input', calculateAll);
    
    // Antenna type selection
    antennaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const antennaType = this.dataset.type;
            switchAntennaType(antennaType);
        });
    });
}

function switchAntennaType(antennaType) {
    // Update button states
    antennaButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-type="${antennaType}"]`).classList.add('active');
    
    // Update results display
    antennaResults.forEach(result => result.classList.remove('active'));
    document.getElementById(`${antennaType}-results`).classList.add('active');
    
    // Recalculate for the selected antenna type
    calculateAll();
}

function calculateAll() {
    const frequency = parseFloat(frequencyInput.value);
    if (isNaN(frequency) || frequency <= 0) return;
    
    console.log('Calculating for frequency:', frequency, 'MHz');
    
    calculateVertical(frequency);
    calculateDipole(frequency);
    calculateYagi(frequency);
    calculateQuad(frequency);
    
    console.log('All calculations completed');
}

function calculateVertical(frequency) {
    const wavelength = SPEED_OF_LIGHT / (frequency * 1000000);
    const quarterWavelength = (wavelength / 4) * VELOCITY_FACTOR;
    const groundPlaneLength = quarterWavelength * 0.95;
    
    console.log('Vertical calculation - wavelength:', wavelength, 'quarter:', quarterWavelength);
    
    document.getElementById('vertical-height').textContent = formatLength(quarterWavelength);
    document.getElementById('vertical-ground').textContent = formatLength(groundPlaneLength);
    document.getElementById('vertical-impedance').textContent = '36.8 Ω';
    document.getElementById('vertical-gain').textContent = '2.15 dBi';
    
    const balunElement = document.getElementById('vertical-balun');
    const ratioElement = document.getElementById('vertical-balun-ratio');
    
    if (balunElement && ratioElement) {
        balunElement.textContent = 'Current Balun';
        ratioElement.textContent = '1:1';
        console.log('Vertical balun info set successfully');
    } else {
        console.error('Vertical balun elements not found:', { balun: balunElement, ratio: ratioElement });
    }
}

function calculateDipole(frequency) {
    const wavelength = SPEED_OF_LIGHT / (frequency * 1000000);
    const halfWavelength = (wavelength / 2) * VELOCITY_FACTOR;
    const eachSide = halfWavelength / 2;
    
    document.getElementById('dipole-length').textContent = formatLength(halfWavelength);
    document.getElementById('dipole-side').textContent = formatLength(eachSide);
    document.getElementById('dipole-impedance').textContent = '73 Ω';
    document.getElementById('dipole-gain').textContent = '2.15 dBi';
    document.getElementById('dipole-balun').textContent = 'Current Balun';
    document.getElementById('dipole-balun-ratio').textContent = '1:1';
}

function calculateYagi(frequency) {
    const wavelength = SPEED_OF_LIGHT / (frequency * 1000000);
    
    // Driven element (resonant)
    const drivenElement = wavelength * VELOCITY_FACTOR;
    
    // Reflector (5% longer)
    const reflector = drivenElement * 1.05;
    
    // Director (5% shorter)
    const director = drivenElement * 0.95;
    
    // Boom length (spacing between elements)
    const boomLength = wavelength * 0.2;
    
    document.getElementById('yagi-driven').textContent = formatLength(drivenElement);
    document.getElementById('yagi-reflector').textContent = formatLength(reflector);
    document.getElementById('yagi-director').textContent = formatLength(director);
    document.getElementById('yagi-boom').textContent = formatLength(boomLength);
    document.getElementById('yagi-gain').textContent = '7-10 dBi';
    document.getElementById('yagi-balun').textContent = 'Current Balun';
    document.getElementById('yagi-balun-ratio').textContent = '1:1';
}

function calculateQuad(frequency) {
    const wavelength = SPEED_OF_LIGHT / (frequency * 1000000);
    
    // Quad loop perimeter (approximately 1 wavelength)
    const loopPerimeter = wavelength * VELOCITY_FACTOR;
    
    // Side length (square loop)
    const sideLength = loopPerimeter / 4;
    
    document.getElementById('quad-perimeter').textContent = formatLength(loopPerimeter);
    document.getElementById('quad-side').textContent = formatLength(sideLength);
    document.getElementById('quad-impedance').textContent = '100-140 Ω';
    document.getElementById('quad-gain').textContent = '3-4 dBi';
    document.getElementById('quad-balun').textContent = 'Voltage Balun';
    document.getElementById('quad-balun-ratio').textContent = '4:1';
}

function formatLength(meters) {
    if (meters >= 1) {
        return `${meters.toFixed(2)} m`;
    } else if (meters >= 0.01) {
        return `${(meters * 100).toFixed(1)} cm`;
    } else {
        return `${(meters * 1000).toFixed(0)} mm`;
    }
}

// Additional utility functions for more advanced calculations
function calculateImpedance(antennaType, frequency, height = null) {
    const wavelength = SPEED_OF_LIGHT / (frequency * 1000000);
    
    switch(antennaType) {
        case 'vertical':
            // Ground plane vertical impedance
            return 36.8;
        case 'dipole':
            // Free space dipole impedance
            return 73;
        case 'yagi':
            // Yagi driven element impedance (varies with design)
            return 50;
        case 'quad':
            // Quad loop impedance
            return 120;
        default:
            return 50;
    }
}

function calculateGain(antennaType, frequency, elements = 1) {
    switch(antennaType) {
        case 'vertical':
            return 2.15; // dBi
        case 'dipole':
            return 2.15; // dBi
        case 'yagi':
            // Yagi gain increases with number of elements
            return 7 + (elements - 3) * 1.5;
        case 'quad':
            return 3.5; // dBi
        default:
            return 0;
    }
}

// Export functions for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateVertical,
        calculateDipole,
        calculateYagi,
        calculateQuad,
        calculateImpedance,
        calculateGain
    };
}
