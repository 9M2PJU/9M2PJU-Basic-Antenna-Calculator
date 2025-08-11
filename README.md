# 📡 9M2PJU Basic Antenna Calculator

A modern, responsive web application for calculating dimensions and properties of common amateur radio antennas.

## 🌟 Features

- **Multiple Antenna Types**: Calculate dimensions for vertical, dipole, yagi, and quad antennas
- **Real-time Calculations**: Instant results as you change frequency
- **Professional Design**: Modern, responsive interface that works on all devices
- **Accurate Physics**: Based on electromagnetic theory and practical antenna design
- **Educational**: Learn about antenna properties and characteristics

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Running the Application
1. Download all files to a directory
2. Open `index.html` in your web browser
3. Enter your desired frequency in MHz
4. Select an antenna type to view calculations

## 📊 Supported Antenna Types

### 1. Vertical Antenna
- **Height**: Quarter-wavelength calculation
- **Ground Plane**: Optimal ground plane dimensions
- **Impedance**: 36.8 Ω (typical for ground plane verticals)
- **Gain**: 2.15 dBi

### 2. Dipole Antenna
- **Total Length**: Half-wavelength calculation
- **Each Side**: Individual element lengths
- **Impedance**: 73 Ω (free space)
- **Gain**: 2.15 dBi

### 3. Yagi Antenna
- **Driven Element**: Resonant length
- **Reflector**: 5% longer than driven element
- **Director**: 5% shorter than driven element
- **Boom Length**: Optimal spacing between elements
- **Gain**: 7-10 dBi (varies with design)

### 4. Quad Antenna
- **Loop Perimeter**: Approximately 1 wavelength
- **Side Length**: Square loop dimensions
- **Impedance**: 100-140 Ω
- **Gain**: 3-4 dBi

## 🔬 Technical Details

### Calculations Include
- **Velocity Factor**: 0.95 (typical for wire antennas)
- **Speed of Light**: 299,792,458 m/s
- **Wavelength Calculations**: λ = c/f
- **Practical Adjustments**: Real-world construction considerations

### Physics Principles
- **Resonance**: Antennas are designed to resonate at specific frequencies
- **Impedance Matching**: Optimal feed point impedance for transmission
- **Gain Patterns**: Directional characteristics and efficiency
- **Ground Effects**: Impact of ground plane and height above ground

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern web browsers

## 🛠️ File Structure

```
9M2PJU-basic-antenna-calculator/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript calculations and interactivity
└── README.md           # This documentation file
```

## 🎯 Usage Examples

### Example 1: 20m Band Dipole
- Frequency: 14.074 MHz
- Result: Each side approximately 5.07 meters
- Total length: 10.14 meters

### Example 2: 2m Band Vertical
- Frequency: 146.52 MHz
- Result: Height approximately 0.49 meters
- Ground plane: 0.46 meters

### Example 3: 70cm Band Yagi
- Frequency: 432.1 MHz
- Result: Driven element approximately 0.66 meters
- Boom length: 0.14 meters

## ⚠️ Important Notes

### Theoretical vs. Practical
- **Dimensions are theoretical** and may require fine-tuning
- **Local conditions** (height, ground conductivity, nearby objects) affect performance
- **Construction materials** and techniques impact final results

### Safety Considerations
- **Check local regulations** before erecting antennas
- **Consider height restrictions** and building codes
- **Ensure structural integrity** of antenna supports
- **Follow electrical safety** guidelines

### Fine-tuning Required
- **SWR measurements** help optimize antenna performance
- **Field strength measurements** verify calculations
- **Adjustment range** typically ±2-5% of calculated values

## 🔧 Customization

The application can be easily customized:
- Modify velocity factors for different materials
- Add new antenna types
- Adjust calculation algorithms
- Customize the user interface

## 📚 Educational Value

This calculator helps amateur radio operators:
- **Understand antenna theory** and electromagnetic principles
- **Plan antenna projects** with accurate dimensions
- **Learn about different antenna types** and their characteristics
- **Compare antenna performance** across frequency ranges

## 🤝 Contributing

Feel free to contribute improvements:
- Report bugs or issues
- Suggest new features
- Submit code improvements
- Enhance documentation

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For questions or support:
- Check the calculations against established references
- Consult amateur radio literature
- Verify results with experienced operators
- Test in real-world conditions

---

**Happy Building!** 🚀

*Remember: The best antenna is the one you can actually build and use effectively.*
