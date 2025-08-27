/**
 * ProductTypeDetector - Détecte le type de produit à partir des headers et données
 * Responsabilité unique : Classification du type de produit
 */

class ProductTypeDetector {
    static PRODUCT_TYPES = {
        LENS: 'LENS',
        FRAME: 'FRAME', 
        EYE_GLASSES: 'EYE_GLASSES',
        CONTACT_LENS: 'CONTACT_LENS',
        UNKNOWN: 'UNKNOWN'
    };

    // Keywords patterns for each product type
    static KEYWORDS = {
        LENS: [
            'optical solution', 'sphere range', 'cylinder range', 'add range',
            'progressive', 'single vision', 'bifocal', 'index', 'coating',
            'photochromic', 'treatment', 'lens diameter'
        ],
        FRAME: [
            'frame', 'bridge', 'temple', 'lens width', 'lens height',
            'frame material', 'frame shape', 'frametype', 'hinge',
            'rim type', 'color description', 'collection'
        ],
        EYE_GLASSES: [
            'frame sku', 'lens sku', 'complete pair', 'pd range',
            'assembled', 'eyeglasses', 'prescription'
        ],
        CONTACT_LENS: [
            'contact', 'base curve', 'diameter', 'water content',
            'oxygen permeability', 'dk/t', 'modality', 'wear schedule',
            'replacement schedule', 'material'
        ]
    };

    /**
     * Detect product type from CSV headers and sample data
     * @param {Array} headers - Column headers from CSV
     * @param {Array} sampleRows - First few rows for analysis
     * @returns {Object} Detection result with type and confidence
     */
    static detect(headers, sampleRows = []) {
        console.log('🔍 Analyzing headers:', headers);
        
        const scores = {};
        const matchedKeywords = {};

        // Initialize scores
        Object.keys(this.KEYWORDS).forEach(type => {
            scores[type] = 0;
            matchedKeywords[type] = [];
        });

        // Analyze headers
        const headerText = headers.join(' ').toLowerCase();
        
        Object.entries(this.KEYWORDS).forEach(([type, keywords]) => {
            keywords.forEach(keyword => {
                if (headerText.includes(keyword.toLowerCase())) {
                    scores[type] += 2; // Headers have more weight
                    matchedKeywords[type].push(keyword);
                }
            });
        });

        // Analyze sample data for additional context
        if (sampleRows && sampleRows.length > 0) {
            sampleRows.forEach(row => {
                const rowText = Object.values(row).join(' ').toLowerCase();
                
                Object.entries(this.KEYWORDS).forEach(([type, keywords]) => {
                    keywords.forEach(keyword => {
                        if (rowText.includes(keyword.toLowerCase())) {
                            scores[type] += 1; // Data has less weight than headers
                            if (!matchedKeywords[type].includes(keyword)) {
                                matchedKeywords[type].push(keyword);
                            }
                        }
                    });
                });
            });
        }

        // Find the best match
        const bestType = Object.entries(scores).reduce((best, [type, score]) => {
            return score > best.score ? { type, score } : best;
        }, { type: this.PRODUCT_TYPES.UNKNOWN, score: 0 });

        // Calculate confidence based on relative score dominance
        const confidence = this._calculateRelativeConfidence(scores, bestType);

        const result = {
            productType: bestType.type,
            confidence: Math.round(confidence),
            matchedKeywords: matchedKeywords[bestType.type] || [],
            allScores: scores,
            reasoning: this._generateReasoning(bestType.type, bestType.score, matchedKeywords[bestType.type])
        };

        console.log('✅ Detection result:', result);
        return result;
    }

    /**
     * Calculate confidence based on score dominance over other types
     * @param {Object} scores - All type scores
     * @param {Object} bestType - Best type with score
     * @returns {number} Confidence percentage
     */
    static _calculateRelativeConfidence(scores, bestType) {
        const allScores = Object.values(scores);
        const totalScore = allScores.reduce((sum, score) => sum + score, 0);
        const bestScore = bestType.score;

        // If no matches at all
        if (totalScore === 0) {
            return 0;
        }

        // If only one type has matches
        if (bestScore === totalScore) {
            // Base confidence on number of matches
            if (bestScore >= 6) return 95;      // Very high confidence
            if (bestScore >= 4) return 85;      // High confidence  
            if (bestScore >= 2) return 75;      // Good confidence
            return 60;                          // Minimum acceptable
        }

        // If multiple types have matches, calculate dominance
        const secondBestScore = allScores.sort((a, b) => b - a)[1] || 0;
        const dominanceRatio = secondBestScore > 0 ? bestScore / secondBestScore : bestScore;
        
        // Calculate confidence based on dominance and absolute score
        let confidence = Math.min((bestScore / totalScore) * 100, 95);
        
        // Boost confidence if clear dominance
        if (dominanceRatio >= 3) confidence = Math.min(confidence + 20, 95);
        if (dominanceRatio >= 2) confidence = Math.min(confidence + 10, 95);
        
        // Ensure minimum confidence for reasonable matches
        if (bestScore >= 4 && confidence < 70) confidence = 70;
        if (bestScore >= 2 && confidence < 60) confidence = 60;

        return Math.max(confidence, 0);
    }

    /**
     * Generate human-readable reasoning for the detection
     */
    static _generateReasoning(type, score, keywords) {
        if (score === 0) {
            return "No specific keywords found, defaulting to UNKNOWN";
        }

        return `Detected as ${type} based on ${keywords.length} matching keywords: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`;
    }

    /**
     * Check if detection confidence is sufficient for processing
     */
    static isConfidenceAcceptable(detectionResult, minConfidence = 60) {
        return detectionResult.confidence >= minConfidence;
    }

    // detect the brand from our brand list with the file name ( ex: './OCEAN PRICES 2025 - mini.xlsx') 
    static detectBrand(filePath) {
        const brand_list = ['Ocean', 'Nike', 'Adidas'];

        const brand = brand_list.find(brand => filePath.split('/').pop().toLowerCase().includes(brand.toLowerCase()));
        if (brand) {
            return brand;
        }
        return 'Unknown';
    }
}

export default ProductTypeDetector; 