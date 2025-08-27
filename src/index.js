/**
 * Main entry point for CSV Converter AI
 * Complete Pipeline: Detection → Mapping → Cleaning → AI Enhancement → GoHub Transformation → CSV Output
 */

import { writeFileSync } from 'fs';
import { GOHUB_SCHEMAS } from './config/index.js';
import BatchAIEnhancer from './services/BatchAIEnhancer.js';
import ColumnMapper from './services/ColumnMapper.js';
import DataCleaner from './services/DataCleaner.js';
import GoHubTransformer from './services/GoHubTransformer.js';
import ProductTypeDetector from './services/ProductTypeDetector.js';
import CsvReader from './utils/CsvReader.js';

class CsvConverterAI {
    constructor() {
        console.log('🚀 CSV Converter AI - Complete Pipeline v2.0');
    }

    async processFile(filePath) {
        console.log('🚀 COMPLETE PIPELINE PROCESSING\n');
        console.log('📋 Steps: Detection → Mapping → Cleaning → AI Enhancement → CSV Output\n');

        const startTime = Date.now();
        const results = {
            success: false,
            steps: {},
            errors: [],
            stats: {}
        };

        try {
            // ============================================
            // STEP 1: CSV READING
            // ============================================
            console.log('📂 STEP 1: Reading CSV');
            console.log('='.repeat(50));

            const csvData = await CsvReader.readFile(filePath);
            
            console.log(`✅ File loaded: ${csvData.fileName} (${csvData.totalRows} rows, ${csvData.headers.length} columns)`);

            results.steps.reading = {
                success: true,
                fileName: csvData.fileName,
                headers: csvData.headers.length,
                rows: csvData.totalRows
            };

            // ============================================
            // STEP 2: PRODUCT TYPE DETECTION
            // ============================================
            console.log('\n🎯 STEP 2: Product type detection');
            console.log('='.repeat(50));

            const sampleRows = CsvReader.getSampleRows(csvData, 5);
            const detectionResult = ProductTypeDetector.detect(csvData.headers, sampleRows);

            console.log(`✅ Type detected: ${detectionResult.productType} (${detectionResult.confidence}% confidence)`);

            results.steps.detection = detectionResult;

            if (!ProductTypeDetector.isConfidenceAcceptable(detectionResult)) {
                console.log('⚠️  WARNING: Low confidence for detection');
            }

            // Detect brand from filename
            const brand = ProductTypeDetector.detectBrand(csvData.fileName);
            console.log(`🔍 Brand detected: ${brand}`);

            // ============================================
            // STEP 3: COLUMN MAPPING
            // ============================================
            console.log('\n🗺️  STEP 3: Column mapping');
            console.log('='.repeat(50));

            const mappingResult = ColumnMapper.mapColumns(csvData.headers, detectionResult.productType);

            const coverage = Math.round((Object.keys(mappingResult.mapping).length / mappingResult.mappingStats.totalTargets) * 100);
            console.log(`✅ Mapping completed: ${coverage}% coverage (${Object.keys(mappingResult.mapping).length}/${mappingResult.mappingStats.totalTargets} fields)`);

            results.steps.mapping = mappingResult;

            // ============================================
            // STEP 4: DATA CLEANING
            // ============================================
            console.log('\n🧹 STEP 4: Data cleaning');
            console.log('='.repeat(50));

            const testRows = csvData.rows;
            console.log(`📊 Processing ${testRows.length} rows...`);

            const cleaningResult = DataCleaner.cleanBatch(testRows, mappingResult.mapping, GOHUB_SCHEMAS);

            const aiPercentage = Math.round((cleaningResult.stats.needsAI / cleaningResult.stats.totalFields) * 100);
            console.log(`✅ Cleaning completed: ${aiPercentage}% of fields need AI enhancement`);

            results.steps.cleaning = cleaningResult;

            // ============================================
            // STEP 5: BATCH AI ENHANCEMENT
            // ============================================
            console.log('\n🚀 STEP 5: Batch AI Enhancement');
            console.log('='.repeat(50));

            const batchEnhancer = new BatchAIEnhancer();
            const enhancementResult = await batchEnhancer.enhanceBatch(cleaningResult.cleanedRows, detectionResult.productType, cleaningResult.stats);


            results.steps.enhancement = enhancementResult;

            // ============================================
            // STEP 6: GOHUB TRANSFORMATION
            // ============================================
            console.log('\n🔄 STEP 6: GoHub transformation');
            console.log('='.repeat(50));

            const transformResult = GoHubTransformer.transformToGoHub(
                enhancementResult.enhancedRows,
                detectionResult.productType,
                brand
            );

            console.log(`✅ GoHub transformation completed: ${transformResult.stats.successfulTransforms}/${transformResult.stats.totalRows} rows transformed`);

            results.steps.transformation = transformResult;
            
            // ============================================
            // OUTPUT GENERATION
            // ============================================
            console.log('\n📄 Generating output files...');
            console.log('='.repeat(50));
            const outputResult = this.generateGoHubCSV(transformResult.transformedRows, detectionResult.productType, brand);

            results.steps.output = outputResult;

            // ============================================
            // COMPLETION
            // ============================================
            const totalTime = Date.now() - startTime;

            console.log('\n🎉 PIPELINE COMPLETED SUCCESSFULLY');
            console.log('='.repeat(50));
            console.log(`⏱️  Total time: ${Math.round(totalTime / 1000)}s`);
            console.log(`📊 Rows processed: ${csvData.totalRows}`);

            results.success = true;
            results.stats = {
                totalTime,
                tokensUsed: enhancementResult.stats.tokensUsed
            };

            return results;

        } catch (error) {
            console.error('\n❌ PIPELINE ERROR:', error.message);

            results.success = false;
            results.errors.push(error.message);
            return results;
        }
    }



    /**
     * Generate GoHub CSV output file with standard GoHub columns
     */
    generateGoHubCSV(transformedRows, productType, brand) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `output-gohub-${brand.toLowerCase()}-${productType.toLowerCase()}-${timestamp}.csv`;

        if (transformedRows.length === 0) {
            console.log('⚠️ No data to export');
            return { fileName: '', rowCount: 0, columnCount: 0 };
        }

        // Get GoHub schema for the product type
        const schema = GOHUB_SCHEMAS[productType];
        if (!schema) {
            console.log('⚠️ No schema found for product type:', productType);
            return { fileName: '', rowCount: 0, columnCount: 0 };
        }

        // Use schema keys for column order (these match the transformed data keys)
        const gohubColumnOrder = Object.keys(schema);

        // Create CSV content with GoHub headers
        const columnHeaders = gohubColumnOrder.map(col => schema[col]);
        let csvContent = columnHeaders.join(',') + '\n';

        transformedRows.forEach(row => {
            const rowValues = gohubColumnOrder.map(col => {
                const value = row[col] || '';
                
                // Convert to string and escape for CSV
                const stringValue = String(value);
                const escaped = stringValue.replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
            });
            csvContent += rowValues.join(',') + '\n';
        });

        // Write to file
        try {
            writeFileSync(fileName, csvContent, 'utf8');
            console.log(`📁 File saved: ${fileName}`);

            return {
                fileName,
                rowCount: transformedRows.length,
                columnCount: gohubColumnOrder.length,
                filePath: fileName
            };
        } catch (error) {
            console.error('❌ Error saving file:', error.message);
            return {
                fileName: '',
                rowCount: 0,
                columnCount: 0,
                error: error.message
            };
        }
    }



}

// Complete pipeline execution
async function demo() {
    const converter = new CsvConverterAI();
    const result = await converter.processFile('./OCEAN PRICES 2025 - mini.xlsx');
    
    if (result.success) {
        console.log('\n🎉 PIPELINE SUCCESS!');
        console.log(`   - Product type: ${result.steps.detection.productType}`);
        console.log(`   - Processing time: ${Math.round(result.stats.totalTime / 1000)}s`);
        console.log(`   - Output: ${result.steps.output.fileName} (${result.steps.output.rowCount} rows)`);
    } else {
        console.log('\n💥 PIPELINE FAILED!');
        console.log(`   Errors: ${result.errors.join(', ')}`);
    }
}

// Run demo if this file is executed directly
if (process.argv[1].endsWith('index.js')) {
    demo();
}

export default CsvConverterAI; 