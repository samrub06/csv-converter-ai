/**
 * BatchAIEnhancer - Ultra-optimized version to reduce AI costs
 */

import dotenv from 'dotenv';
dotenv.config();

class BatchAIEnhancer {
    constructor() {
        this.cache = new Map();
        this.patterns = new Map(); // Cache for recurring patterns
        this.tokenUsage = { total: 0, calls: 0 };
        this.apiKey = process.env.OPENAI_API_KEY;

        console.log(this.apiKey ? '✅ OpenAI API key loaded' : '⚠️ No API key - simulation mode');
    }

    /**
     * 🚀 BATCH PROCESSING - Processes multiple similar fields together
     */
    async enhanceBatch(cleanedRows, cleaningStats = {}) {
        console.log(`🚀 BATCH AI enhancing ${cleanedRows.length} rows (ULTRA-OPTIMIZED)`);

        const stats = {
            totalFields: 0,
            aiEnhanced: 0,
            cached: 0,
            ruled: cleaningStats.ruled || 0, // Get from DataCleaner stats
            batched: 0, // Processed in batch
            tokensUsed: 0,
            batchSavings: 0
        };

        // STEP 1: Group similar fields for batch processing
        const fieldGroups = this._groupSimilarFields(cleanedRows);
        console.log(`📊 Field groups:`, Object.keys(fieldGroups).map(k => `${k}(${fieldGroups[k].length})`));

        // STEP 2: Process each field type with unified batch processing
        for (const [fieldType, items] of Object.entries(fieldGroups)) {
            await this._processFieldGroup(fieldType, items, cleanedRows, stats);
        }

        // STEP 3: Special SIZE analysis for frame specifications
        await this._processSizeAnalysis(cleanedRows, stats);

        return {
            enhancedRows: cleanedRows, // Return the modified rows directly
            stats: {
                ...stats,
                totalFields: stats.totalFields
            }
        };
    }





    /**
     * 🔄 Process a field group with unified batch logic
     */
    async _processFieldGroup(fieldType, items, rows, stats) {
        const needsAI = items.filter(item =>
            rows[item.rowIndex][item.fieldName].needsAI
        );

        if (needsAI.length === 0) return;

        if (needsAI.length > 8) {
            // Large batch: split into chunks
            console.log(`📦 Large batch detected (${needsAI.length}), splitting into chunks of 8`);

            for (let i = 0; i < needsAI.length; i += 8) {
                const chunk = needsAI.slice(i, i + 8);
                console.log(`🔥 Processing chunk ${Math.floor(i / 8) + 1}: ${chunk.length} items`);

                const chunkResults = await this._processBatch(fieldType, chunk);
                this._applyBatchResults(chunk, chunkResults, rows, stats);
            }
        } else if (needsAI.length >= 3) {
            // Normal batch (3-8 items)
            console.log(`🔥 Batch processing ${needsAI.length} ${fieldType} fields`);

            const batchResults = await this._processBatch(fieldType, needsAI);
            this._applyBatchResults(needsAI, batchResults, rows, stats);
        } else {
            // Individual processing for remaining cases
            for (const item of needsAI) {
                const result = await this._enhanceIndividual(item);
                rows[item.rowIndex][item.fieldName] = {
                    ...rows[item.rowIndex][item.fieldName],
                    ...result,
                    enhanced: true
                };

                stats.aiEnhanced++;
                stats.tokensUsed += result.tokensUsed || 80;
            }
        }
    }

    /**
     * 📊 Apply batch results to enhanced rows
     */
    _applyBatchResults(items, batchResults, enhancedRows, stats) {
        batchResults.forEach((result, index) => {
            const item = items[index];
            const enhancedField = enhancedRows[item.rowIndex][item.fieldName];
            
            // Merge AI results with existing data
            const mergedResult = {
                ...enhancedField,
                ...result,
                enhanced: true,
                source: 'batch-ai-optimized'
            };

            // Special handling for description fields to extract additional information
            if (item.fieldName.toLowerCase().includes('description') && result.frameType) {
                // Add frame characteristics to the row if not already present
                if (result.frameType && !enhancedRows[item.rowIndex].frameType) {
                    enhancedRows[item.rowIndex].frameType = {
                        value: result.frameType,
                        confidence: 85,
                        enhanced: true,
                        source: 'description-analysis',
                        needsAI: false
                    };
                }
                
                if (result.frameShape && !enhancedRows[item.rowIndex].frameShape) {
                    enhancedRows[item.rowIndex].frameShape = {
                        value: result.frameShape,
                        confidence: 85,
                        enhanced: true,
                        source: 'description-analysis',
                        needsAI: false
                    };
                }
            }

            // Special handling for color fields to extract additional information
            if (item.fieldName.toLowerCase().includes('color') && result.baseColor) {
                mergedResult.baseColor = result.baseColor;
                if (result.colorDescription) {
                    mergedResult.colorDescription = result.colorDescription;
                }
                if (result.hasLens !== undefined) {
                    mergedResult.hasLens = result.hasLens;
                }
            }

            // Special handling for characteristics to extract additional information
            if (item.fieldName.toLowerCase().includes('characteristic') || 
                item.fieldName.toLowerCase().includes('feature')) {
                if (result.polarized !== undefined) {
                    mergedResult.polarized = result.polarized;
                }
                if (result.uv !== undefined) {
                    mergedResult.uv = result.uv;
                }
                if (result.protection) {
                    mergedResult.protection = result.protection;
                }
                if (result.category) {
                    mergedResult.category = result.category;
                }
            }

            enhancedRows[item.rowIndex][item.fieldName] = mergedResult;
        });

        stats.batched += items.length;
        stats.tokensUsed += batchResults[0]?.totalTokens || 200;

        // Calculate savings: batch vs individual
        const individualCost = items.length * 100;
        const batchCost = batchResults[0]?.totalTokens || 200;
        stats.batchSavings += (individualCost - batchCost);
    }

    /**
     * 📦 GROUPING OF SIMILAR FIELDS
     */
    _groupSimilarFields(cleanedRows) {
        const groups = {};

        cleanedRows.forEach((row, rowIndex) => {
            Object.entries(row).forEach(([fieldName, cleanResult]) => {
                if (cleanResult.needsAI) {
                    const fieldType = this._getFieldType(fieldName);

                    if (!groups[fieldType]) groups[fieldType] = [];
                    groups[fieldType].push({
                        rowIndex,
                        fieldName,
                        cleanResult,
                        value: cleanResult.value
                    });
                }
            });
        });

        return groups;
    }

    _getFieldType(fieldName) {
        const fieldLower = fieldName.toLowerCase();

        // Color analysis - prioritize for eyewear
        if (fieldLower.includes('color') || fieldLower.includes('colour')) return 'color';
        
        // Description analysis - most important for product understanding
        if (fieldLower.includes('description') || fieldLower.includes('desc')) return 'description';
        
        // Characteristics and features - important for product classification
        if (fieldLower.includes('characteristic') || fieldLower.includes('feature') || 
            fieldLower.includes('polarized') || fieldLower.includes('uv') || 
            fieldLower.includes('protection') || fieldLower.includes('category')) return 'characteristics';
        
        // Product names and models - important for identification
        if (fieldLower.includes('name') || fieldLower.includes('model') || 
            fieldLower.includes('product') || fieldLower.includes('sku')) return 'name';
        
        // Size and dimensions - important for frame specifications
        if (fieldLower.includes('size') || fieldLower.includes('dimension') || 
            fieldLower.includes('lens') || fieldLower.includes('bridge') || 
            fieldLower.includes('temple') || fieldLower.includes('width') || 
            fieldLower.includes('height') || fieldLower.includes('length')) return 'size_analysis';

        return 'other';
    }

    /**
     * 🚀 BATCH PROCESSING - Single AI call for multiple fields
     */
    async _processBatch(fieldType, items) {
        const prompt = this._buildBatchPrompt(fieldType, items);

        try {
            const response = await this._callOpenAI(prompt);
            return this._parseBatchResponse(response, items);

        } catch (error) {
            console.error(`❌ Batch failed for ${fieldType}:`, error.message);

            // Fallback: simulation
            return items.map(item => ({
                value: `Enhanced ${item.value}`.substring(0, 50),
                confidence: 75,
                source: 'batch-fallback',
                tokensUsed: 50
            }));
        }
    }

    _buildBatchPrompt(fieldType, items) {
        const templates = {
            color: `Analyze color information for eyewear frames:
${items.map((item, i) => `${i + 1}."${item.value}"`).join('\n')}
Return JSON array: [{baseColor,colorDescription,hasLens}] where:
- baseColor: Primary color (Black, Brown, Blue, Red, Green, etc.)
- colorDescription: Full color description (e.g., "Shiny Black", "Matte Brown")
- hasLens: true if includes lens color, false if frame only`,

            description: `Analyze eyewear product descriptions and extract key information:
${items.map((item, i) => `${i + 1}."${item.value}"`).join('\n')}
Return JSON array with EXACTLY ${items.length} objects: [{summary,gender,model,collection,frameType,frameShape}] where:
- summary: Clean product description (max 8 words) - focus on MAIN product features
- gender: Male/Female/Unisex (analyze content carefully, look for gender indicators)
- model: Main model name or number mentioned
- collection: Brand collection/series name (e.g., "LAS VEGAS", "CLASSIC", "SPORT")
- frameType: full-rim/semi-rimless/rimless (infer from description)
- frameShape: rectangular/round/oval/cat-eye/aviator/square/other (infer from description)
IMPORTANT: Analyze each description individually. For collection, look for brand names, series names, or collection identifiers. For frame characteristics, infer from descriptive terms.`,

            size_analysis: `Analyze eyewear frame dimensions:
${items.map((item, i) => {
                const dims = typeof item.value === 'object' ?
                    `L${item.value.lensWidth || 0}B${item.value.bridge || 0}T${item.value.temple || 0}H${item.value.lensHeight || 0}`
                    : item.value;
                return `${i + 1}.${dims}`;
            }).join(' ')}
Return JSON array: [{frameType,frameShape,rimType,hingeType}] where:
- frameType: full-rim/semi-rimless/rimless (infer from dimensions)
- frameShape: rectangular/round/oval/cat-eye/aviator/square/other (use L/H ratio)
- rimType: full/semi/rimless (infer from frameType)
- hingeType: standard/spring/pin/screw/other (default: standard)`,

            characteristics: `Analyze eyewear characteristics and features:
${items.map((item, i) => `${i + 1}."${item.value}"`).join('\n')}
Return JSON array: [{polarized,uv,protection,category}] where:
- polarized: true/false (look for "polarized", "polarization")
- uv: true/false (look for "UV", "ultraviolet", "protection")
- protection: UV400/UV380/none (extract protection level)
- category: Sunglasses/Reading/Computer/Other (determine from features)`,

            name: `Extract product names and model information:
${items.map((item, i) => `${i + 1}."${item.value}"`).join('\n')}
Return JSON array: [{productName,modelNumber,brand}] where:
- productName: Clean product name (max 6 words)
- modelNumber: Model number/code if present
- brand: Brand name if mentioned`,

            other: `Clean and standardize data:
${items.map((item, i) => `${i + 1}."${item.value}"`).join('\n')}
Return JSON array: [{cleanedValue,confidence}] where:
- cleanedValue: Cleaned and standardized value
- confidence: 1-100 confidence in the cleaning`
        };

        return templates[fieldType] || templates.other;
    }

    _parseBatchResponse(response, items) {
        try {
            let content = response.choices[0].message.content;

            // Clean up code fences and markdown
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            const parsed = JSON.parse(content);

            if (Array.isArray(parsed)) {
                const totalTokens = response.usage?.total_tokens || 200;

                // Case 1: Perfect match - return as is
                if (parsed.length === items.length) {
                    return parsed.map((result) => ({
                        value: this._expandAbbreviatedResult(result),
                        confidence: 85,
                        source: 'batch-ai',
                        tokensUsed: Math.round(totalTokens / items.length),
                        totalTokens
                    }));
                }

                // Case 2: AI returned more results than expected (like your case)
                if (parsed.length > items.length) {
                    console.log(`⚠️ AI returned ${parsed.length} results for ${items.length} items, taking first ${items.length}`);
                    return parsed.slice(0, items.length).map((result) => ({
                        value: this._expandAbbreviatedResult(result),
                        confidence: 80, // Slightly lower confidence
                        source: 'batch-ai-truncated',
                        tokensUsed: Math.round(totalTokens / items.length),
                        totalTokens
                    }));
                }

                // Case 3: AI returned fewer results than expected
                if (parsed.length < items.length) {
                    console.log(`⚠️ AI returned ${parsed.length} results for ${items.length} items, padding with fallbacks`);
                    const results = parsed.map((result) => ({
                        value: this._expandAbbreviatedResult(result),
                        confidence: 80,
                        source: 'batch-ai-partial',
                        tokensUsed: Math.round(totalTokens / parsed.length),
                        totalTokens
                    }));

                    // Fill remaining items with fallback
                    for (let i = parsed.length; i < items.length; i++) {
                        results.push({
                            value: `${items[i].value}`.substring(0, 100),
                            confidence: 60,
                            source: 'batch-ai-fallback',
                            tokensUsed: 30
                        });
                    }

                    return results;
                }
            }
        } catch (error) {
            console.error('❌ Parse batch response failed:', error.message);
            console.error('❌ Raw content:', response.choices[0].message.content.substring(0, 200));
        }

        // Final fallback
        return items.map(item => ({
            value: `${item.value}`.substring(0, 100),
            confidence: 70,
            source: 'batch-parse-error',
            tokensUsed: 30
        }));
    }

    /**
     * Expand abbreviated batch results to full format
     */
    _expandAbbreviatedResult(result) {
        if (typeof result === 'string') return result;
        if (typeof result !== 'object') return result;

        const expanded = {};

        // Handle color fields - support both old abbreviations and new full names
        if (result.bc) expanded.baseColor = result.bc;
        if (result.baseColor) expanded.baseColor = result.baseColor;
        if (result.cd) expanded.colorDescription = result.cd;
        if (result.colorDescription) expanded.colorDescription = result.colorDescription;
        if (result.hl !== undefined) expanded.hasLens = result.hl;
        if (result.hasLens !== undefined) expanded.hasLens = result.hasLens;

        // Handle description fields - support both old abbreviations and new full names
        if (result.sm) expanded.summary = result.sm;
        if (result.summary) expanded.summary = result.summary;
        if (result.gn) expanded.gender = result.gn;
        if (result.gender) expanded.gender = result.gender;
        if (result.md) expanded.model = result.md;
        if (result.model) expanded.model = result.model;
        if (result.cl) expanded.collection = result.cl;
        if (result.collection) expanded.collection = result.collection;
        
        // New description fields from optimized prompts
        if (result.frameType) expanded.frameType = result.frameType;
        if (result.frameShape) expanded.frameShape = result.frameShape;

        // Handle characteristics - support both old abbreviations and new full names
        if (result.pol !== undefined) expanded.polarized = result.pol;
        if (result.polarized !== undefined) expanded.polarized = result.polarized;
        if (result.uv !== undefined) expanded.uv = result.uv;
        if (result.protection) expanded.protection = result.protection;
        if (result.category) expanded.category = result.category;

        // Handle product names and models
        if (result.productName) expanded.productName = result.productName;
        if (result.modelNumber) expanded.modelNumber = result.modelNumber;
        if (result.brand) expanded.brand = result.brand;

        // Handle size analysis results
        if (result.frameType) expanded.frameType = result.frameType;
        if (result.frameShape) expanded.frameShape = result.frameShape;
        if (result.rimType) expanded.rimType = result.rimType;
        if (result.hingeType) expanded.hingeType = result.hingeType;

        // Handle other fields
        if (result.cleanedValue) expanded.value = result.cleanedValue;
        if (result.confidence) expanded.confidence = result.confidence;

        // Normalize boolean values for characteristics
        if ('polarized' in expanded && expanded.polarized === undefined) {
            expanded.polarized = false;
        }
        if ('uv' in expanded && expanded.uv === undefined) {
            expanded.uv = false;
        }

        // If no expansions found, return original
        return Object.keys(expanded).length > 0 ? expanded : result;
    }

    async _callOpenAI(prompt) {
        if (!this.apiKey) {
            return {
                choices: [{ message: { content: '["Simulated result"]' } }],
                usage: { total_tokens: 50 }
            };
        }

        this.tokenUsage.calls++;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo-0125", // Latest model with better performance
                messages: [
                    {
                        role: "system",
                        content: "You are an expert eyewear data analyst. Extract precise information and return clean JSON only. Be accurate and consistent."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 800, // Increased for better analysis
                temperature: 0.1, // Lower temperature for more consistent results
                response_format: { type: "json_object" } // Force JSON format
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const data = await response.json();
        this.tokenUsage.total += data.usage?.total_tokens || 0;

        return data;
    }

    async _enhanceIndividual(item) {
        // Simplified individual enhancement for remaining cases
        return {
            value: `Enhanced ${item.value}`.substring(0, 50),
            confidence: 80,
            source: 'individual-ai',
            tokensUsed: 80
        };
    }



    /**
     * 🔬 Process SIZE analysis for frame specifications (simplified)
     */
    async _processSizeAnalysis(enhancedRows, stats) {
        console.log('🔬 Analyzing SIZE data for frame specifications...');

        const sizeRowsWithData = this._collectSizeRows(enhancedRows);

        if (sizeRowsWithData.length === 0) {
            console.log('   ⚠️ No size data found for frame specs analysis');
            return;
        }

        console.log(`   📊 Found ${sizeRowsWithData.length} rows with size data`);
        await this._processSizeBatches(sizeRowsWithData, enhancedRows, stats);
        console.log(`   ✅ Size analysis completed for ${sizeRowsWithData.length} rows`);
    }

    /**
     * 📦 Collect rows with SIZE data
     */
    _collectSizeRows(enhancedRows) {
        const sizeRowsWithData = [];

        enhancedRows.forEach((row, rowIndex) => {
            const sizeField = row['SIZE'] || row['size'] || row['DIMENSION'];
            if (sizeField && sizeField.value && typeof sizeField.value === 'object') {
                const dims = sizeField.value;
                if (dims.lensWidth || dims.bridge || dims.temple || dims.lensHeight) {
                    sizeRowsWithData.push({
                        rowIndex,
                        dimensions: dims,
                        originalValue: sizeField.value
                    });
                }
            }
        });

        return sizeRowsWithData;
    }

    /**
     * 🚀 Process SIZE batches
     */
    async _processSizeBatches(sizeRowsWithData, enhancedRows, stats) {
        for (let i = 0; i < sizeRowsWithData.length; i += 8) {
            const batch = sizeRowsWithData.slice(i, i + 8);

            try {
                const prompt = this._buildSizeAnalysisPrompt(batch);
                const response = await this._callOpenAI(prompt);
                const results = this._parseSizeAnalysisResponse(response, batch);

                this._applySizeResults(batch, results, enhancedRows, stats);
                stats.tokensUsed += response.usage?.total_tokens || 150;
                console.log(`   🤖 Analyzed batch ${Math.floor(i / 8) + 1}: ${batch.length} items`);

            } catch (error) {
                console.error(`   ❌ Size analysis failed for batch ${Math.floor(i / 8) + 1}:`, error.message);
            }
        }
    }

    /**
     * 📋 Apply SIZE analysis results to enhanced rows
     */
    _applySizeResults(batch, results, enhancedRows, stats) {
        results.forEach((result, index) => {
            const { rowIndex } = batch[index];

            if (result && typeof result === 'object') {
                // Add derived fields from SIZE analysis with normalized keys
                const fieldsToAdd = [
                    { key: 'frameType', value: result.frameType },
                    { key: 'frameShape', value: result.frameShape },
                    { key: 'rimType', value: result.rimType },
                    { key: 'hingeType', value: result.hingeType }
                ];

                fieldsToAdd.forEach(({ key, value }) => {
                    if (value) {
                        enhancedRows[rowIndex][key] = {
                            value,
                            confidence: 85,
                            enhanced: true,
                            source: 'size-analysis-ai',
                            needsAI: false
                        };
                    }
                });

                stats.ruled += 4; // Count as ruled since derived from existing data
            }
        });
    }



    /**
     * Build prompt for dimension analysis (OPTIMIZED)
     */
    _buildSizeAnalysisPrompt(batch) {
        const dims = batch.map((item, i) => {
            const d = item.dimensions;
            return `${i + 1}.L${d.lensWidth || 0}B${d.bridge || 0}T${d.temple || 0}H${d.lensHeight || 0}`;
        }).join(' ');

        return `Analyze dims:${dims}
Ret JSON:[{ft,fs,rt,ht}]
ft:f=full-rim,s=semi-rimless,r=rimless
fs:rec=rectangular,rnd=round,ov=oval,cat=cat-eye,av=aviator,sq=square,oth=other  
rt:f=full,s=semi,r=rimless
ht:std=standard,spr=spring,pin=pin,scr=screw,oth=other
Use ratio L/H for shape. std vals: ft=f,fs=rec,rt=f,ht=std`;
    }

    /**
     * Parse dimension analysis response (OPTIMIZED)
     */
    _parseSizeAnalysisResponse(response, batch) {
        try {
            let content = response.choices[0].message.content;
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            const parsed = JSON.parse(content);

            if (Array.isArray(parsed) && parsed.length === batch.length) {
                // Convert abbreviated format to full format
                return parsed.map(item => ({
                    frameType: this._expandFrameType(item.ft),
                    frameShape: this._expandFrameShape(item.fs),
                    rimType: this._expandRimType(item.rt),
                    hingeType: this._expandHingeType(item.ht)
                }));
            }
        } catch (error) {
            console.error('❌ Parse size analysis response failed:', error.message);
        }

        // Fallback: generate default values
        return batch.map(({ dimensions }) => ({
            frameType: this._inferFrameTypeFromDimensions(dimensions),
            frameShape: 'rectangular',
            rimType: 'full',
            hingeType: 'standard'
        }));
    }

    /**
     * Expand abbreviated responses to full format
     */
    _expandFrameType(abbr) {
        const map = { 'f': 'full-rim', 's': 'semi-rimless', 'r': 'rimless' };
        return map[abbr] || 'full-rim';
    }

    _expandFrameShape(abbr) {
        const map = {
            'rec': 'rectangular', 'rnd': 'round', 'ov': 'oval',
            'cat': 'cat-eye', 'av': 'aviator', 'sq': 'square', 'oth': 'other'
        };
        return map[abbr] || 'rectangular';
    }

    _expandRimType(abbr) {
        const map = { 'f': 'full', 's': 'semi', 'r': 'rimless' };
        return map[abbr] || 'full';
    }

    _expandHingeType(abbr) {
        const map = { 'std': 'standard', 'spr': 'spring', 'pin': 'pin', 'scr': 'screw', 'oth': 'other' };
        return map[abbr] || 'standard';
    }

    /**
     * Infer frame type from dimensions (fallback)
     */
    _inferFrameTypeFromDimensions(dimensions) {
        const { lensWidth, lensHeight, bridge } = dimensions;

        // Basic logic based on typical proportions
        if (lensWidth && lensHeight) {
            const ratio = lensWidth / lensHeight;
            if (ratio > 1.8) return 'rectangular';
            if (ratio < 1.2) return 'round';
        }

        return 'full-rim'; // Default safe value
    }

    getUsageStats() {
        return {
            totalCalls: this.tokenUsage.calls,
            totalTokens: this.tokenUsage.total,
            estimatedCost: (this.tokenUsage.total * 0.002).toFixed(4),
            hasApiKey: !!this.apiKey
        };
    }
}

export default BatchAIEnhancer;