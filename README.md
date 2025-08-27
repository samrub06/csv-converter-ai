# CSV Converter AI 🚀

A powerful and intelligent CSV conversion pipeline that automatically detects product types, maps columns, cleans data, and transforms it to GoHub format using AI enhancement.

## ✨ Features

- **Smart Product Detection**: Automatically identifies product types with confidence scoring
- **Intelligent Column Mapping**: Maps CSV columns to GoHub schema fields
- **AI-Powered Data Cleaning**: Uses AI to enhance and clean data quality
- **GoHub Transformation**: Converts data to GoHub-compatible format
- **Batch Processing**: Handles large datasets efficiently
- **Comprehensive Pipeline**: Complete workflow from CSV input to GoHub output

## 🏗️ Architecture

```
CSV Input → Detection → Mapping → Cleaning → AI Enhancement → GoHub Transform → CSV Output
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI enhancement features)

## 🚀 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd csv-converter-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

## 💻 Usage

### Basic Usage
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### Programmatic Usage
```javascript
import CsvConverterAI from './src/index.js';

const converter = new CsvConverterAI();
const result = await converter.processFile('./your-file.csv');
```

## 🔧 Configuration

The application uses configuration files in the `src/config/` directory:

- `schemas.js`: GoHub schema definitions
- `mappingPatterns.js`: Column mapping patterns
- `index.js`: Main configuration

## 📊 Supported Product Types

- Electronics
- Clothing
- Home & Garden
- Sports & Outdoors
- And more...

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with sample data
npm start
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── services/        # Core business logic
│   ├── AIEnhancer.js
│   ├── BatchAIEnhancer.js
│   ├── ColumnMapper.js
│   ├── DataCleaner.js
│   ├── GoHubTransformer.js
│   └── ProductTypeDetector.js
├── utils/           # Utility functions
│   └── CsvReader.js
└── index.js         # Main entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/your-username/csv-converter-ai/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

- [ ] Web interface
- [ ] Real-time processing
- [ ] Additional export formats
- [ ] Performance optimizations
- [ ] Extended AI capabilities

---

Made with ❤️ by the CSV Converter AI Team