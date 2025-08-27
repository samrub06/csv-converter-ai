/**
 * ColumnMapper - Maps input columns to GoHub standard schema
 */

import { getSchemaValues, MAPPING_PATTERNS } from '../config/index.js';

class ColumnMapper {

    /**
     * Normalize string for better matching by removing spaces, special chars and converting to lowercase
     * @param {string} str - String to normalize
     * @returns {string} Normalized string
     */
    static _normalizeForMatching(str) {
        return str
            .toLowerCase()
            .replace(/\s+/g, '')           // Remove all spaces
            .replace(/[_-]/g, '')          // Remove underscores and hyphens
            .replace(/[^\w]/g, '');        // Remove any non-word characters except letters/numbers
    }

    /**
     * Find the best matching GoHub field for a CSV header
     * @param {string} csvHeader - CSV header to match
     * @returns {string|null} GoHub field key or null if no match
     */
    static _findBestMatchingField(csvHeader) {
        // Normalize the CSV header
        const normalizedHeader = this._normalizeForMatching(csvHeader);
        
        // First, try exact matches (highest priority)
        for (const [goHubKey, patterns] of Object.entries(MAPPING_PATTERNS)) {
            for (const pattern of patterns) {
                const normalizedPattern = this._normalizeForMatching(pattern);
                if (normalizedHeader === normalizedPattern) {
                    return goHubKey;
                }
            }
        }
        
        // Then, try contains matches (lower priority)
        for (const [goHubKey, patterns] of Object.entries(MAPPING_PATTERNS)) {
            for (const pattern of patterns) {
                const normalizedPattern = this._normalizeForMatching(pattern);
                if (normalizedHeader.includes(normalizedPattern) || 
                    normalizedPattern.includes(normalizedHeader)) {
                    return goHubKey;
                }
            }
        }
        
        return null; // No match found
    }

    /**
     * Check if two strings match after normalization
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {boolean} True if they match
     */
    static _isNormalizedMatch(str1, str2) {
        const norm1 = this._normalizeForMatching(str1);
        const norm2 = this._normalizeForMatching(str2);
        
        // Check for exact match or contains relationship
        return norm1 === norm2 || 
               norm1.includes(norm2) || 
               norm2.includes(norm1);
    }

    /**
     * Map input columns to GoHub schema
     * @param {Array} inputHeaders - Pre-normalized headers from CsvReader
     * @param {string} productType - Detected product type
     * @returns {Object} Mapping result
     */
    static mapColumns(inputHeaders, productType) {
        console.log(`🗺️  Mapping columns for product type: ${productType}`);
        console.log(`📋 Input headers (${inputHeaders.length}):`, inputHeaders);
        console.log(`🔄 Headers are already normalized from CsvReader`);
        
        const targetSchema = getSchemaValues(productType) || [];
        console.log(`🎯 Target schema (${targetSchema.length} fields):`, targetSchema.slice(0, 5), '...');
        
        const mapping = {};
        const confidence = {};
        const unmapped = [...inputHeaders];
        const unmatched = [...targetSchema];
        
        // Step 1: Direct pattern matching - start from CSV headers to find GoHub keys
        inputHeaders.forEach(header => {
            // Find the best matching GoHub field for this CSV header
            const targetField = this._findBestMatchingField(header);
            
            if (targetField && !mapping[targetField] && !Object.values(mapping).includes(header)) {
                mapping[targetField] = header;
                confidence[targetField] = this._calculateMappingConfidence(targetField, header, header);
                
                // Remove from unmapped lists
                const unmappedIndex = unmapped.indexOf(header);
                if (unmappedIndex > -1) unmapped.splice(unmappedIndex, 1);
                
                const unmatchedIndex = unmatched.indexOf(targetField);
                if (unmappedIndex > -1) unmatched.splice(unmappedIndex, 1);
                
                console.log(`✅ Mapped: "${header}" → "${targetField}" (confidence: ${confidence[targetField]}%)`);
            } else if (!targetField) {
                console.log(`⚠️  No mapping found for: "${header}"`);
            }
        });
        
        // Step 2: Handle complex fields (like SIZE containing multiple dimensions)
        this._handleComplexMappings(mapping, confidence, unmapped, unmatched, inputHeaders, productType);
        
        const result = {
            productType,
            mapping,  // Direct mapping with normalized headers
            confidence,
            unmappedInputs: unmapped,
            unmatchedTargets: unmatched,
            mappingStats: {
                totalInputs: inputHeaders.length,
                totalTargets: targetSchema.length,
                mapped: Object.keys(mapping).length,
                avgConfidence: this._calculateAverageConfidence(confidence)
            }
        };
        
        console.log(`📊 Mapping completed: ${Object.keys(mapping).length}/${targetSchema.length} fields mapped`);
        console.log(`📈 Average confidence: ${result.mappingStats.avgConfidence}%`);
        
        return result;
    }

    /**
     * Handle complex mappings like SIZE field containing multiple dimensions
     * Works with pre-normalized headers from CsvReader
     */
    static _handleComplexMappings(mapping, confidence, unmapped, unmatched, normalizedInputHeaders, productType) {
        if (productType === 'FRAME') {
            // Enhanced SIZE field detection - case insensitive, space tolerant
            const sizePatterns = ['size', 'sizes', 'dimension', 'dimensions', 'measurements', 'measure'];
            
            const sizeField = normalizedInputHeaders.find(header => {
                const normalizedHeader = this._normalizeForMatching(header);
                return sizePatterns.some(pattern => {
                    const normalizedPattern = this._normalizeForMatching(pattern);
                    // Exact match or header contains pattern
                    return normalizedHeader === normalizedPattern || 
                           normalizedHeader.includes(normalizedPattern) ||
                           normalizedPattern.includes(normalizedHeader);
                });
            });
            
            // Only use SIZE field if no individual dimension fields are already mapped
            if (sizeField && !mapping['size'] && !mapping['lensWidth'] && !mapping['bridgeWidth'] && !mapping['templeLength']) {
                // Map SIZE field to size - DataCleaner will handle extraction
                mapping['size'] = sizeField;
                
                // Higher confidence for exact "size" match, lower for partial matches
                const sizeConfidence = this._normalizeForMatching(sizeField) === 'size' ? 85 : 70;
                confidence['size'] = sizeConfidence;
                
                // Remove from unmapped
                const unmappedIndex = unmapped.indexOf(sizeField);
                if (unmappedIndex > -1) unmapped.splice(unmappedIndex, 1);
                
                // Remove from unmatched
                const unmatchedIndex = unmatched.indexOf('size');
                if (unmatchedIndex > -1) unmatched.splice(unmappedIndex, 1);
                
                console.log(`🔧 Complex mapping: "${sizeField}" → size (DataCleaner will extract dimensions)`);
            }
            
            // Handle CHARACTERISTICS and COMPOSITION fields for frame material
            // First try CHARACTERISTICS
            let materialField = normalizedInputHeaders.find(header => {
                const normalized = this._normalizeForMatching(header);
                return normalized.includes('characteristic');
            });
            
            // If no CHARACTERISTICS, try COMPOSITION
            if (!materialField) {
                materialField = normalizedInputHeaders.find(header => {
                    const normalized = this._normalizeForMatching(header);
                    return normalized.includes('composition') || normalized.includes('material');
                });
            }
            
            if (materialField && !mapping['frameMaterial']) {
                mapping['frameMaterial'] = materialField;
                confidence['frameMaterial'] = 80;
                
                const unmappedIndex = unmapped.indexOf(materialField);
                if (unmappedIndex > -1) unmapped.splice(unmappedIndex, 1);
                
                const unmatchedIndex = unmatched.indexOf('frameMaterial');
                if (unmatchedIndex > -1) unmatched.splice(unmatchedIndex, 1);
                
                console.log(`🔧 Material mapping: "${materialField}" → frameMaterial (confidence: 80%)`);
            }
        }
    }

    /**
     * Calculate confidence for a specific mapping using normalized strings
     */
    static _calculateMappingConfidence(targetField, inputHeader, pattern) {
        const normalizedInput = this._normalizeForMatching(inputHeader);
        const normalizedPattern = this._normalizeForMatching(pattern);
        
        // Exact match after normalization
        if (normalizedInput === normalizedPattern) return 95;
        
        // Contains pattern after normalization
        if (normalizedInput.includes(normalizedPattern) || normalizedPattern.includes(normalizedInput)) {
            const similarity = Math.min(normalizedInput.length, normalizedPattern.length) / 
                             Math.max(normalizedInput.length, normalizedPattern.length);
            return Math.round(70 + (similarity * 25));
        }
        
        return 60; // Minimum confidence
    }

    /**
     * Calculate average confidence across all mappings
     */
    static _calculateAverageConfidence(confidenceMap) {
        const confidences = Object.values(confidenceMap);
        if (confidences.length === 0) return 0;
        
        const avg = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
        return Math.round(avg);
    }

    /**
     * Check if mapping quality is acceptable
     */
    static isMappingAcceptable(mappingResult, minMappedPercentage = 60, minAvgConfidence = 70) {
        const mappedPercentage = (Object.keys(mappingResult.mapping).length / mappingResult.mappingStats.totalTargets) * 100;
        
        return mappedPercentage >= minMappedPercentage && 
               mappingResult.mappingStats.avgConfidence >= minAvgConfidence;
    }
}

export default ColumnMapper; 