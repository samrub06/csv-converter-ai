/**
 * DataCleaner - Optimized for real Ocean Glasses data
 * Responsabilité unique : Nettoyage minimal et efficace
 */

class DataCleaner {
    /**
     * Clean a single field - MINIMAL approach
     * @param {string} fieldName - Name of the field
     * @param {any} rawValue - Raw value
     * @param {Object} schemas - GoHub schemas for field validation
     * @returns {Object} Cleaning result
     */
    static cleanField(fieldName, rawValue, schemas = {}) {
        if (!rawValue || typeof rawValue !== 'string') {
            return {
                value: rawValue,
                confidence: rawValue ? 100 : 0,
                needsAI: false,
                cleaning: []
            };
        }

        const fieldLower = fieldName.toLowerCase();
        let cleaned = rawValue.trim();
        const cleaning = [];
        let confidence = 60;

        // Only handle CLEAR patterns from your real data
        const extracted = this._extractIfObvious(fieldLower, cleaned, schemas);
        
        if (extracted) {
            return {
                value: extracted.value,
                confidence: extracted.confidence,
                needsAI: false,
                cleaning: [extracted.method]
            };
        }

        // Simple cleaning only
        const originalLength = cleaned.length;
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        if (cleaned.length !== originalLength) {
            cleaning.push('Normalized spaces');
            confidence += 5;
        }

        // Decide if AI needed based on your real data patterns
        const needsAI = this._shouldUseAI(fieldLower, cleaned);

        return {
            value: cleaned,
            confidence: needsAI ? Math.min(confidence, 70) : confidence,
            needsAI,
            cleaning
        };
    }

    /**
     * Extract only OBVIOUS patterns from your real data
     * Now uses both CSV field names AND standardized schema field names
     */
    static _extractIfObvious(fieldName, text, schemas = {}) {
        // SIZE field - can be detected by CSV name OR standardized name
        const isSizeField = fieldName.includes('size') || 
                           fieldName.includes('lensWidth') || 
                           fieldName.includes('bridgeWidth') || 
                           fieldName.includes('templeLength');
        
        if (isSizeField && text.includes('Width:')) {
            const extracted = {};
            
            const widthMatch = text.match(/(?:Lens\s*)?Width:\s*(\d+)/i);
            const heightMatch = text.match(/(?:Lens\s*)?Height:\s*(\d+)/i);
            const bridgeMatch = text.match(/Bridge:\s*(\d+)/i);
            const armsMatch = text.match(/Arms:\s*(\d+)/i);
            
            if (widthMatch) extracted.lensWidth = parseInt(widthMatch[1]);
            if (heightMatch) extracted.lensHeight = parseInt(heightMatch[1]);
            if (bridgeMatch) extracted.bridgeWidth = parseInt(bridgeMatch[1]);
            if (armsMatch) extracted.templeLength = parseInt(armsMatch[1]);
            
            if (Object.keys(extracted).length > 0) {
                return {
                    value: extracted,
                    confidence: 85,
                    method: `Extracted dimensions: ${Object.keys(extracted).join(', ')}`
                };
            }
        }

        // COMPOSITION/MATERIAL field - can be detected by CSV name OR standardized name
        const isMaterialField = fieldName.includes('composition') || 
                               fieldName.includes('frameMaterial') || 
                               fieldName.includes('material');
        
        if (isMaterialField && text.includes('Frame:')) {
            const frameMatch = text.match(/Frame:\s*([^L]+?)(?:\s*Lens:|$)/i);
            const lensMatch = text.match(/Lens:\s*(.+)$/i);
            
            if (frameMatch || lensMatch) {
                return {
                    value: {
                        frameMaterial: frameMatch ? frameMatch[1].trim() : null,
                        lensMaterial: lensMatch ? lensMatch[1].trim() : null
                    },
                    confidence: 90,
                    method: 'Extracted frame/lens materials'
                };
            }
        }

        // POLARIZED - simple boolean
        if (fieldName.includes('polar') && /^(yes|no|true|false)$/i.test(text.trim())) {
            const isTrue = /^(yes|true)$/i.test(text.trim());
            return {
                value: isTrue,
                confidence: 95,
                method: 'Converted to boolean'
            };
        }

        return null;
    }

    /**
     * Decide if AI needed based on your real data analysis
     */
    static _shouldUseAI(fieldName, text) {
        // Based on your analysis - these fields need AI
        if (fieldName.includes('frame') && fieldName.includes('color')) return true;
        if (fieldName.includes('description') && text.length > 100) return true;
        if (fieldName.includes('size') && text.length > 100) return true;
        
        // Links, codes, simple values - no AI needed
        if (fieldName.includes('name') && text.includes(' ')) return false;
        if (fieldName.includes('characteristic') && text.length > 50) return false;
        if (fieldName.includes('link')) return false;
        if (fieldName.includes('code')) return false;
        if (fieldName.includes('ean')) return false;
        if (fieldName.includes('reference')) return false;
        if (fieldName.includes('price')) return false;
        if (fieldName.includes('pvp')) return false;
        if (fieldName.includes('quantity')) return false;
        if (fieldName.includes('total')) return false;
        
        // Default: if long text, use AI
        return text.length > 80;
    }

    /**
     * Apply intelligent rules to avoid AI processing when possible
     */
    static _applyIntelligentRules(fieldName, cleanResult) {
        if (!cleanResult.needsAI) return null;
        
        // Ocean Glasses specific patterns
        const oceanPattern = this._applyOceanGlassesRules(fieldName, cleanResult.value);
        if (oceanPattern) {
            return {
                ...cleanResult,
                ...oceanPattern,
                enhanced: true,
                needsAI: false,
                source: 'ocean-rule'
            };
        }

        return null;
    }

    /**
     * Ocean Glasses specific rules - extracted from AI enhancer
     */
    static _applyOceanGlassesRules(fieldName, value) {
        if (!value || typeof value !== 'string') return null;
        
        const fieldLower = fieldName.toLowerCase();
        
        // Extract Color (base) from FRAME COLOR
        if (fieldLower.includes('color')) {
            const colorPatterns = {
                'shiny black': { baseColor: 'Black', description: 'Shiny Black' },
                'matte black': { baseColor: 'Black', description: 'Matte Black' },
                'demy brown': { baseColor: 'Brown', description: 'Demy Brown' },
                'black and brown': { baseColor: 'Brown', description: 'Black and Brown' },
                'clear': { baseColor: 'Clear', description: 'Clear' },
                'transparent': { baseColor: 'Clear', description: 'Transparent' }
            };
            
            for (const [pattern, extracted] of Object.entries(colorPatterns)) {
                if (value.toLowerCase().includes(pattern)) {
                    return {
                        value: extracted.baseColor,
                        confidence: 95,
                        colorDescription: extracted.description
                    };
                }
            }
        }        

        // Material patterns
        if (fieldLower.includes('composition') || fieldLower.includes('material')) {
            if (value.includes('100%Acetate')) {
                return {
                    value: 'Acetate',
                    confidence: 95
                };
            }
        }

        return null;
    }

    /**
     * Clean a batch of rows with intelligent rules application
     * @param {Array} rows - Raw data rows
     * @param {Object} mapping - Column mapping from ColumnMapper
     * @param {Object} schemas - GoHub schemas for field validation
     * @returns {Object} Cleaned data with transformed field names
     */
    static cleanBatch(rows, mapping = {}, schemas = {}) {
        console.log(`🧹 Cleaning batch of ${rows.length} rows`);
        console.log(`🗺️  Using mapping: ${Object.keys(mapping).length} fields`);
        console.log(`📋 Using schemas: ${Object.keys(schemas).length} product types`);
        
        const cleanedRows = [];
        const stats = {
            totalFields: 0,
            cleanedFields: 0,
            needsAI: 0,
            extracted: 0,
            ruled: 0, // Fields handled by intelligent rules
            transformed: 0 // Fields with transformed names
        };

        // Create reverse mapping (input field → target field)
        const reverseMapping = {};
        Object.entries(mapping).forEach(([targetField, inputField]) => {
            reverseMapping[inputField] = targetField;
        });

        rows.forEach((row, rowIndex) => {
            const cleanedRow = {};
            
            Object.entries(row).forEach(([fieldName, rawValue]) => {
                stats.totalFields++;
                
                const cleanResult = this.cleanField(fieldName, rawValue, schemas);
                
                // Apply intelligent rules before marking as needing AI
                const ruledResult = this._applyIntelligentRules(fieldName, cleanResult);
                const finalResult = ruledResult || cleanResult;
                
                // Transform field name using mapping
                const targetFieldName = reverseMapping[fieldName] || fieldName;
                if (targetFieldName !== fieldName) {
                    stats.transformed++;
                }
                
                cleanedRow[targetFieldName] = finalResult;
                
                if (ruledResult) {
                    stats.ruled++;
                } else if (finalResult.needsAI) {
                    stats.needsAI++;
                }
                
                if (finalResult.cleaning && finalResult.cleaning.some(c => c.includes('Extracted'))) {
                    stats.extracted++;
                }
                
                stats.cleanedFields++;
            });
            
            cleanedRows.push(cleanedRow);
        });

        console.log(`✅ Ocean Glasses cleaning completed:`, stats);
        console.log(`   📦 Extractions: ${stats.extracted}`);
        console.log(`   🎯 Rules applied: ${stats.ruled}`);
        console.log(`   🔄 Fields transformed: ${stats.transformed}`);
        console.log(`   🤖 AI needed: ${stats.needsAI}/${stats.totalFields} (${Math.round((stats.needsAI/stats.totalFields)*100)}%)`);
        
        return {
            cleanedRows,
            stats
        };
    }
}

export default DataCleaner;