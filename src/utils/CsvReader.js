/**
 * CsvReader - Utility for reading Excel/CSV files
 * Handles both .xlsx and .csv formats with advanced cleaning
 */

import fs from 'fs';
import XLSX from 'xlsx';

class CsvReader {
    /**
     * Normalize header for consistency throughout the pipeline
     * @param {string} header - Original header
     * @returns {string} Normalized header
     */
    static _normalizeHeader(header) {
        return header
            .toLowerCase()
            .replace(/\s+/g, '')           // Remove all spaces
            .replace(/[_-]/g, '')          // Remove underscores and hyphens
            .replace(/[^\w]/g, '');        // Remove any non-word characters except letters/numbers
    }

    /**
     * Read Excel or CSV file and return structured data with normalized headers
     * @param {string} filePath - Path to the file
     * @returns {Object} Parsed data with headers and rows
     */
    static async readFile(filePath) {
        console.log('📖 Reading file:', filePath);
        
        try {
            let result;
            if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
                result = this._readExcel(filePath);
            } else if (filePath.endsWith('.csv')) {
                result = this._readCsv(filePath);
            } else {
                throw new Error('Unsupported file format. Please use .xlsx, .xls, or .csv');
            }

            // Clean the data
            const cleanedResult = this._cleanData(result);
            return cleanedResult;

        } catch (error) {
            console.error('❌ Error reading file:', error.message);
            throw error;
        }
    }

    /**
     * Clean data by removing empty rows and rows without reference
     * @param {Object} data - Raw data from file
     * @returns {Object} Cleaned data with stats
     */
    static _cleanData(data) {
        console.log('🧹 Cleaning data...');
        
        const originalRowCount = data.rows.length;
        const referenceColumn = this._findReferenceColumn(data.headers);
        
        console.log(`📍 Reference column detected: "${referenceColumn}"`);

        const cleanedRows = data.rows.filter((row, index) => {
            // Check if row is completely empty
            const hasAnyData = Object.values(row).some(value => 
                value !== null && 
                value !== undefined && 
                String(value).trim() !== ''
            );

            if (!hasAnyData) {
                console.log(`🗑️  Removing empty row ${index + 1}`);
                return false;
            }

            // Check if reference column has data
            if (referenceColumn) {
                const referenceValue = row[referenceColumn];
                const hasReference = referenceValue !== null && 
                                   referenceValue !== undefined && 
                                   String(referenceValue).trim() !== '';

                if (!hasReference) {
                    console.log(`🗑️  Removing row ${index + 1} - no reference (${referenceColumn})`);
                    return false;
                }
            }

            // Additional cleaning: remove rows with only spaces/special chars
            const meaningfulValues = Object.values(row).filter(value => {
                const str = String(value).trim();
                return str !== '' && 
                       str !== '-' && 
                       str !== 'N/A' && 
                       str !== 'null' && 
                       str !== 'undefined' &&
                       !str.match(/^[\s\-_.,;:]*$/);
            });

            if (meaningfulValues.length === 0) {
                console.log(`🗑️  Removing row ${index + 1} - no meaningful data`);
                return false;
            }

            return true;
        });

        const removedCount = originalRowCount - cleanedRows.length;
        
        console.log(`✅ Data cleaning completed:`);
        console.log(`   - Original rows: ${originalRowCount}`);
        console.log(`   - Cleaned rows: ${cleanedRows.length}`);
        console.log(`   - Removed rows: ${removedCount}`);

        return {
            ...data,
            rows: cleanedRows,
            totalRows: cleanedRows.length,
            cleaningStats: {
                originalRows: originalRowCount,
                cleanedRows: cleanedRows.length,
                removedRows: removedCount,
                referenceColumn: referenceColumn
            }
        };
    }

    /**
     * Find the reference column (SKU, ID, REFERENCE, etc.)
     * @param {Array} headers - Column headers
     * @returns {string|null} Reference column name
     */
    static _findReferenceColumn(headers) {
        const referencePatterns = [
            /^reference$/i,
            /^ref$/i,
            /^sku$/i,
            /^id$/i,
            /^product.?id$/i,
            /^item.?id$/i,
            /^code$/i,
            /^product.?code$/i,
            /^article$/i,
            /^numero$/i,
            /^number$/i
        ];

        // First, try exact matches with common reference patterns
        for (const pattern of referencePatterns) {
            const match = headers.find(header => pattern.test(header.trim()));
            if (match) {
                return match;
            }
        }

        // Fallback: assume first column is reference if it contains ID-like data
        if (headers.length > 0) {
            const firstColumn = headers[0];
            if (firstColumn && firstColumn.toLowerCase().includes('ref') || 
                firstColumn.toLowerCase().includes('id') ||
                firstColumn.toLowerCase().includes('sku')) {
                return firstColumn;
            }
        }

        // Last fallback: use first column
        return headers[0] || null;
    }

    /**
     * Read Excel file
     */
    static _readExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length === 0) {
            throw new Error('File is empty or could not be parsed');
        }

        // Find the header row (skip empty rows at the top)
        let headerRowIndex = 0;
        while (headerRowIndex < data.length && 
               (!data[headerRowIndex] || data[headerRowIndex].every(cell => !cell))) {
            headerRowIndex++;
        }

        if (headerRowIndex >= data.length) {
            throw new Error('No valid headers found in the file');
        }

        // Extract, clean and normalize headers
        const originalHeaders = data[headerRowIndex]
            .map(header => typeof header === 'string' ? header.trim() : String(header || '').trim())
            .filter(header => header !== '');
        
        if (originalHeaders.length === 0) {
            throw new Error('No valid column headers found');
        }

        // Create normalized headers
        const headers = originalHeaders.map(header => this._normalizeHeader(header));
        
        // Create mapping for debugging
        const headerMapping = {};
        originalHeaders.forEach((original, index) => {
            headerMapping[headers[index]] = original;
        });

        // Extract rows (skip header and empty rows) with normalized keys
        const rows = data.slice(headerRowIndex + 1)
            .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
            .map(row => {
                const rowObj = {};
                headers.forEach((normalizedHeader, index) => {
                    const cellValue = row[index];
                    // Clean cell values and use normalized headers as keys
                    rowObj[normalizedHeader] = cellValue !== null && cellValue !== undefined 
                        ? String(cellValue).trim() 
                        : '';
                });
                return rowObj;
            });

        console.log(`✅ Parsed Excel: ${headers.length} columns, ${rows.length} rows (before cleaning)`);
        console.log(`🔄 Headers normalized: ${originalHeaders.slice(0, 3).map((orig, i) => `"${orig}" → "${headers[i]}"`).join(', ')}...`);
        
        return {
            headers,
            originalHeaders,
            headerMapping,
            rows,
            totalRows: rows.length,
            fileName: filePath.split('/').pop()
        };
    }

    /**
     * Read CSV file
     */
    static _readCsv(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        // Find header line (skip empty lines at the top)
        let headerLineIndex = 0;
        while (headerLineIndex < lines.length && !lines[headerLineIndex].trim()) {
            headerLineIndex++;
        }

        const originalHeaders = lines[headerLineIndex]
            .split(',')
            .map(h => h.trim().replace(/"/g, ''))
            .filter(h => h !== '');

        // Create normalized headers
        const headers = originalHeaders.map(header => this._normalizeHeader(header));
        
        // Create mapping for debugging
        const headerMapping = {};
        originalHeaders.forEach((original, index) => {
            headerMapping[headers[index]] = original;
        });

        const rows = lines.slice(headerLineIndex + 1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const rowObj = {};
                headers.forEach((normalizedHeader, index) => {
                    rowObj[normalizedHeader] = values[index] || '';
                });
                return rowObj;
            });

        console.log(`✅ Parsed CSV: ${headers.length} columns, ${rows.length} rows (before cleaning)`);
        console.log(`🔄 Headers normalized: ${originalHeaders.slice(0, 3).map((orig, i) => `"${orig}" → "${headers[i]}"`).join(', ')}...`);
        
        return {
            headers,
            originalHeaders,
            headerMapping,
            rows,
            totalRows: rows.length,
            fileName: filePath.split('/').pop()
        };
    }

    /**
     * Get sample rows for analysis (first N rows)
     */
    static getSampleRows(data, count = 3) {
        return data.rows.slice(0, Math.min(count, data.rows.length));
    }

    /**
     * Get data quality statistics
     */
    static getDataQuality(data) {
        const totalRows = data.rows.length;
        if (totalRows === 0) return { completeness: 0, issues: ['No data rows'] };

        let completeRows = 0;
        let issues = [];
        
        data.rows.forEach((row, index) => {
            const filledFields = Object.values(row).filter(value => 
                value !== null && value !== undefined && String(value).trim() !== ''
            ).length;
            
            const completeness = filledFields / data.headers.length;
            if (completeness >= 0.8) completeRows++;
            if (completeness < 0.5) {
                issues.push(`Row ${index + 1}: Only ${Math.round(completeness * 100)}% complete`);
            }
        });

        return {
            completeness: Math.round((completeRows / totalRows) * 100),
            completeRows,
            totalRows,
            issues: issues.slice(0, 5) // Limit to 5 issues for readability
        };
    }
}

export default CsvReader; 