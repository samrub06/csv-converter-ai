/**
 * AIEnhancer - Enhances data using targeted AI calls
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class AIEnhancer {
    constructor() {
        this.cache = new Map(); // Cache to avoid redundant calls
        this.tokenUsage = { total: 0, calls: 0 };
        this.apiKey = process.env.OPENAI_API_KEY;
        
        if (!this.apiKey) {
            console.warn('⚠️ No OpenAI API key found in environment variables');
            console.warn('💡 Add OPENAI_API_KEY to your .env file');
        } else {
            console.log('✅ OpenAI API key loaded');
        }
    }

    /**
     * Enhance a single field using AI
     * @param {string} fieldName - Name of the field
     * @param {any} cleanedValue - Value from DataCleaner
     * @param {string} productType - Product type context
     * @returns {Object} Enhanced result
     */
    async enhanceField(fieldName, cleanedValue, productType = 'FRAME') {
        console.log(`🤖 AI enhancing "${fieldName}": "${cleanedValue}"`);

        // Check cache first
        const cacheKey = `${fieldName}_${String(cleanedValue).substring(0, 50)}`;
        if (this.cache.has(cacheKey)) {
            console.log(`✅ Using cached result for "${fieldName}"`);
            return {
                ...this.cache.get(cacheKey),
                source: 'cache'
            };
        }

        // Skip AI if no API key available
        if (!this.apiKey) {
            return this._simulateResponse(fieldName, cleanedValue);
        }

        try {
            // Build targeted prompt
            const prompt = this._buildTargetedPrompt(fieldName, cleanedValue, productType);
            
            // Call OpenAI with minimal tokens
            const aiResult = await this._callOpenAI(prompt);
            
            // Parse and validate result
            const enhancedResult = this._parseAIResponse(aiResult, fieldName);
            
            // Cache successful results
            if (enhancedResult.confidence >= 80) {
                this.cache.set(cacheKey, enhancedResult);
            }

            console.log(`✅ AI enhanced result:`, enhancedResult);
            return enhancedResult;

        } catch (error) {
            console.error(`❌ AI enhancement failed for "${fieldName}":`, error.message);
            
            // Fallback to simulation or original value
            return this._simulateResponse(fieldName, cleanedValue, error.message);
        }
    }

    /**
     * Build targeted, minimal prompts for different field types
     */
    _buildTargetedPrompt(fieldName, value, productType) {
        const fieldLower = fieldName.toLowerCase();
        
        // Optimized ultra-short prompts for different field types
        const promptTemplates = {
            size: `Extract: "${value}". JSON: {"lenswidth":n,"bridge":n,"temple":n}`,
            
            color: `Colors from: "${value}". JSON: {"framecolor":"x","lensColor":"x"}`,
            
            characteristics: `Features: "${value}". JSON: {"polarized":bool,"category":n}`,
            
            description: `Summarize in 60 chars: "${value}"`,
            
            material: `Material: "${value}". One word: acetate/metal/tr90/titanium/nylon`,
            
            price: `Price: "${value}". Number only.`,
            
            name: `Clean name: "${value}". Max 40 chars.`,
            
            default: `Clean "${fieldName}": "${value}"`
        };

        // Choose appropriate template
        if (fieldLower.includes('size') || fieldLower.includes('dimension')) {
            return promptTemplates.size;
        } else if (fieldLower.includes('color') || fieldLower.includes('colour')) {
            return promptTemplates.color;
        } else if (fieldLower.includes('characteristic') || fieldLower.includes('feature')) {
            return promptTemplates.characteristics;
        } else if (fieldLower.includes('description')) {
            return promptTemplates.description;
        } else if (fieldLower.includes('material') || fieldLower.includes('composition')) {
            return promptTemplates.material;
        } else if (fieldLower.includes('price') || fieldLower.includes('prix')) {
            return promptTemplates.price;
        } else if (fieldLower.includes('name')) {
            return promptTemplates.name;
        }
        
        return promptTemplates.default;
    }

    /**
     * Call OpenAI API with token tracking
     */
    async _callOpenAI(prompt) {
        this.tokenUsage.calls++;
        
        const requestBody = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Extract optical data. Return requested format only."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Track token usage
        this.tokenUsage.total += data.usage?.total_tokens || 100;
        
        console.log(`🔢 Tokens used: ${data.usage?.total_tokens || 100}`);
        
        return data.choices[0]?.message?.content || 'No response';
    }

    /**
     * Simulate response when no API key or as fallback
     */
    _simulateResponse(fieldName, cleanedValue, error = null) {
        console.log(`🎭 Simulating AI response for "${fieldName}"`);
        
        const fieldLower = fieldName.toLowerCase();
        
        // Generate realistic simulation based on field type
        let simulatedValue = cleanedValue;
        let confidence = 65;
        
        if (fieldLower.includes('size') && typeof cleanedValue === 'string') {
            // Try to extract dimensions
            const widthMatch = cleanedValue.match(/(?:width|w):?\s*(\d+)/i);
            const bridgeMatch = cleanedValue.match(/bridge:?\s*(\d+)/i);
            const templeMatch = cleanedValue.match(/(?:arms?|temple):?\s*(\d+)/i);
            
            if (widthMatch || bridgeMatch || templeMatch) {
                simulatedValue = {
                    lenswidth: widthMatch ? parseInt(widthMatch[1]) : null,
                    bridge: bridgeMatch ? parseInt(bridgeMatch[1]) : null,
                    temple: templeMatch ? parseInt(templeMatch[1]) : null
                };
                confidence = 80;
            }
        } else if (fieldLower.includes('color') && typeof cleanedValue === 'string') {
            const colors = ['black', 'brown', 'blue', 'gray', 'clear', 'smoke'];
            const foundColor = colors.find(color => cleanedValue.toLowerCase().includes(color));
            if (foundColor) {
                simulatedValue = { framecolor: foundColor };
                confidence = 75;
            }
        } else if (fieldLower.includes('price') && typeof cleanedValue === 'string') {
            const priceMatch = cleanedValue.match(/(\d+(?:\.\d{2})?)/);
            if (priceMatch) {
                simulatedValue = parseFloat(priceMatch[1]);
                confidence = 85;
            }
        }

        return {
            value: simulatedValue,
            confidence,
            source: error ? 'fallback-simulation' : 'simulation',
            tokensUsed: 0,
            error: error || undefined
        };
    }

    /**
     * Parse and validate AI response
     */
    _parseAIResponse(aiResponse, fieldName) {
        try {
            // Try to parse JSON responses
            if (aiResponse.startsWith('{') || aiResponse.startsWith('[')) {
                const parsed = JSON.parse(aiResponse);
                return {
                    value: parsed,
                    confidence: 90,
                    source: 'openai-json',
                    tokensUsed: 100
                };
            }
            
            // Handle single value responses
            const trimmed = aiResponse.trim();
            
            // Try to convert to appropriate type
            if (!isNaN(trimmed) && trimmed !== '') {
                return {
                    value: parseFloat(trimmed),
                    confidence: 85,
                    source: 'openai-number',
                    tokensUsed: 80
                };
            }
            
            // Boolean conversion
            if (['true', 'false'].includes(trimmed.toLowerCase())) {
                return {
                    value: trimmed.toLowerCase() === 'true',
                    confidence: 85,
                    source: 'openai-boolean',
                    tokensUsed: 80
                };
            }
            
            // String response
            return {
                value: trimmed,
                confidence: 80,
                source: 'openai-text',
                tokensUsed: 90
            };
            
        } catch (error) {
            console.error('❌ Failed to parse AI response:', error.message);
            
            return {
                value: aiResponse,
                confidence: 60,
                source: 'openai-raw',
                tokensUsed: 100
            };
        }
    }

    /**
     * Enhance a batch of cleaned rows
     * @param {Array} cleanedRows - Rows from DataCleaner
     * @param {string} productType - Product type
     * @returns {Object} Batch enhancement result
     */
    async enhanceBatch(cleanedRows, productType) {
        console.log(`🤖 AI enhancing batch of ${cleanedRows.length} rows`);
        
        const enhancedRows = [];
        const stats = {
            totalFields: 0,
            aiEnhanced: 0,
            cached: 0,
            simulated: 0,
            errors: 0,
            tokensUsed: 0
        };

        for (const cleanedRow of cleanedRows) {
            const enhancedRow = {};
            
            for (const [fieldName, cleanResult] of Object.entries(cleanedRow)) {
                stats.totalFields++;
                
                if (cleanResult.needsAI) {
                    try {
                        const enhanced = await this.enhanceField(fieldName, cleanResult.value, productType);
                        enhancedRow[fieldName] = {
                            ...cleanResult,
                            ...enhanced,
                            enhanced: true
                        };
                        
                        if (enhanced.source === 'cache') {
                            stats.cached++;
                        } else if (enhanced.source.includes('simulation')) {
                            stats.simulated++;
                        } else {
                            stats.aiEnhanced++;
                        }
                        
                        stats.tokensUsed += enhanced.tokensUsed || 0;
                        
                    } catch (error) {
                        enhancedRow[fieldName] = {
                            ...cleanResult,
                            error: error.message
                        };
                        stats.errors++;
                    }
                } else {
                    // Keep original cleaned result
                    enhancedRow[fieldName] = cleanResult;
                }
            }
            
            enhancedRows.push(enhancedRow);
        }

        console.log(`✅ AI enhancement completed:`, stats);
        
        return {
            enhancedRows,
            stats
        };
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        const estimatedCost = (this.tokenUsage.total * 0.002).toFixed(4);
        return {
            totalCalls: this.tokenUsage.calls,
            totalTokens: this.tokenUsage.total,
            cacheSize: this.cache.size,
            estimatedCost,
            hasApiKey: !!this.apiKey
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ AI cache cleared');
    }
}

export default AIEnhancer; 