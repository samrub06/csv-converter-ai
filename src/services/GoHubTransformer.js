/**
 * GoHubTransformer - Transforms enhanced data to standard GoHub format
 * Uses GoHub schema to properly structure data
 */

import { getSchema } from '../config/schemas.js';

class GoHubTransformer {

    /**
     * Main transformation to GoHub format
     */
    static transformToGoHub(enhancedRows, productType = 'FRAME', brand = 'Ocean') {
        console.log(`🔄 GoHubTransformer: Transforming ${enhancedRows.length} rows to GoHub format`);

        const transformedRows = [];
        const stats = {
            totalRows: enhancedRows.length,
            successfulTransforms: 0,
            failedTransforms: 0,
            fieldsProcessed: 0,
            mappingStats: {}
        };

        // Get target schema
        const targetSchema = getSchema(productType);
        console.log(`🎯 GoHub Schema: ${Object.keys(targetSchema).length} target fields`);

        // Analyze mapping for statistics
        const mappingCoverage = this.analyzeMappingCoverage(enhancedRows, targetSchema);
        stats.mappingStats = mappingCoverage;

        enhancedRows.forEach((row, index) => {
            try {
                const transformed = this.transformRow(row, targetSchema, productType, brand);
                transformedRows.push(transformed);
                stats.successfulTransforms++;
                stats.fieldsProcessed += Object.keys(transformed).filter(k => transformed[k] && transformed[k] !== '').length;

                // Debug first 3 rows
                if (index < 3) {
                    const filledFields = Object.keys(transformed).filter(k => transformed[k] && transformed[k] !== '');
                    console.log(`\n✅ Row ${index + 1} transformed (${filledFields.length} fields filled)`);
                }

            } catch (error) {
                console.error(`❌ Error row ${index + 1}:`, error.message);
                stats.failedTransforms++;
            }
        });

        console.log(`✅ GoHub transformation completed: ${stats.successfulTransforms}/${stats.totalRows} success`);

        return {
            transformedRows,
            stats,
            productType,
            schema: targetSchema,
            mappingCoverage
        };
    }

    /**
     * Transform a single row to GoHub format
     */
    static transformRow(row, targetSchema, productType, brand) {
        const transformed = {};

        // Initialize all fields with empty values
        Object.keys(targetSchema).forEach(key => {
            transformed[key] = '';
        });

        // Map fields according to GoHub schema
        this.mapGoHubFields(transformed, row, targetSchema, productType, brand);

        return transformed;
    }

    /**
     * Map fields according to GoHub schema
     */
    static mapGoHubFields(transformed, row, targetSchema, productType, brand) {
        // Brand - always defined
        transformed.brand = brand;

        // Frame category - determine from color (Sunglasses if not Clear, Eyeglasses if Clear)
        if (row.color && row.color.value) {
            const colorValue = this._cleanValue(row.color.value).toLowerCase();
            // If color is Clear, Transparent or similar, it's Eyeglasses, otherwise Sunglasses
            if (colorValue.includes('clear') || colorValue.includes('transparent') || colorValue.includes('transp')) {
                transformed.frameCategory = 'Eyeglasses';
            } else {
                transformed.frameCategory = 'Sunglasses';
            }
        } else {
            // Fallback: use polarized if no color
            if (row.polarized && row.polarized.value === true) {
                transformed.frameCategory = 'Sunglasses';
            } else {
                transformed.frameCategory = 'Eyeglasses';
            }
        }

        // SKU - from reference
        if (row.sku && row.sku.value) {
            transformed.sku = row.sku.value;
        }

        // Description - extract from AI enhancement
        if (row.description && row.description.value) {
            transformed.description = this._cleanValue(row.description.value, 200);
        }

        // Collection - extract from AI enhancement OR from original name field
        if (row.description && row.description.value && Array.isArray(row.description.value)) {
            const firstDesc = row.description.value[0];
            if (firstDesc.collection) {
                transformed.collection = firstDesc.collection;
            } else if (firstDesc.model) {
                // If no collection but a model, use model as collection
                transformed.collection = firstDesc.model;
            }
        }

        // If no collection found in AI, try to extract from original name field
        if (!transformed.collection && row.description && row.description.value) {
            let nameValue = '';

            // Get value from original name field
            if (typeof row.description.value === 'string') {
                nameValue = row.description.value;
            } else if (Array.isArray(row.description.value) && row.description.value.length > 0) {
                // If it's an array, take the first element
                const firstItem = row.description.value[0];
                if (typeof firstItem === 'string') {
                    nameValue = firstItem;
                } else if (firstItem && firstItem.summary) {
                    nameValue = firstItem.summary;
                }
            }

            // Extract model from name to put in collection
            if (nameValue) {
                const modelMatch = nameValue.match(/\b(LAS VEGAS|VICTORIA|NICOSIA|DE NIRO|BOWIE|BURTON|BONDI BEACH)\b/i);
                if (modelMatch) {
                    transformed.collection = modelMatch[1].toUpperCase();
                }
            }
        }

        // Gender - extract from AI enhancement with Unisex fallback
        if (row.description && row.description.value && Array.isArray(row.description.value)) {
            const firstDesc = row.description.value[0];
            if (firstDesc.gender) {
                transformed.gender = firstDesc.gender;
            } else {
                transformed.gender = 'Unisex';
            }
        } else {
            // If no AI description, set Unisex as default
            transformed.gender = 'Unisex';
        }

        // Frame type - from AI enhancement or size analysis
        if (row.frameType && row.frameType.value) {
            transformed.frameType = this._cleanValue(row.frameType.value);
        } else if (row.description && row.description.value && Array.isArray(row.description.value)) {
            const firstDesc = row.description.value[0];
            if (firstDesc.frameType) {
                transformed.frameType = firstDesc.frameType;
            }
        }

        // Frame material - from composition or characteristics
        if (row.composition && row.composition.value && row.composition.value.frameMaterial) {
            transformed.frameMaterial = this._cleanValue(row.composition.value.frameMaterial);
        } else if (row.frameMaterial && row.frameMaterial.value) {
            transformed.frameMaterial = this._cleanValue(row.frameMaterial.value, 100);
        }

        // Frame shape - from AI enhancement or size analysis
        if (row.frameShape && row.frameShape.value) {
            transformed.frameShape = this._cleanValue(row.frameShape.value);
        } else if (row.description && row.description.value && Array.isArray(row.description.value)) {
            const firstDesc = row.description.value[0];
            if (firstDesc.frameShape) {
                transformed.frameShape = firstDesc.frameShape;
            }
        }

        // Color - from color field
        if (row.color && row.color.value) {
            transformed.color = this._cleanValue(row.color.value);
        }

        // Color description - from color field
        if (row.color && row.color.colorDescription) {
            transformed.colorDescription = this._cleanValue(row.color.colorDescription);
        }

        // Dimensions - from size field
        if (row.size && row.size.value) {
            if (typeof row.size.value === 'object') {
                if (row.size.value.lensWidth) {
                    transformed.lensWidth = row.size.value.lensWidth;
                }
                if (row.size.value.lensHeight) {
                    transformed.lensHeight = row.size.value.lensHeight;
                }
                if (row.size.value.bridgeWidth) {
                    transformed.bridgeWidth = row.size.value.bridgeWidth;
                }
                if (row.size.value.templeLength) {
                    transformed.templeLength = row.size.value.templeLength;
                }
            }
        }

        // Rim type - from size analysis
        if (row.rimType && row.rimType.value) {
            transformed.rimType = row.rimType.value;
        }

        // Hinge type - from size analysis
        if (row.hingeType && row.hingeType.value) {
            transformed.hingeType = row.hingeType.value;
        }

        // UPC - from ean field
        if (row.upc && row.upc.value) {
            transformed.upc = row.upc.value;
        }

        // Season - default value
        transformed.season = 'All Year';

        // Weight - empty by default
        transformed.weight = '';

        // Recommended Price - from pvp field
        if (row.recommendedPrice && row.recommendedPrice.value) {
            transformed.recommendedPrice = row.recommendedPrice.value;
        }

        // Price - from gohubprice field
        if (row.price && row.price.value) {
            transformed.price = row.price.value;
        }

        // Processing days - empty by default
        transformed.processingDays = '';

        // Image1 - from links field
        if (row.image1 && row.image1.value) {
            transformed.image1 = row.image1.value;
        }

        // Image2 and Image3 - empty by default
        transformed.image2 = '';
        transformed.image3 = '';

        // Manufacturer model - from manufacturerModel
        if (row.manufacturerModel && row.manufacturerModel.value) {
            transformed.manufacturerModel = this._cleanValue(row.manufacturerModel.value);
        }
    }

    /**
     * Clean complex values to avoid [object Object] in CSV
     */
    static _cleanValue(value, maxLength = 200) {
        if (value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'string') {
            return value.substring(0, maxLength);
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return '';

            // If array contains objects, try to extract useful information
            if (typeof value[0] === 'object' && value[0] !== null) {
                const firstItem = value[0];

                // Try to extract summary, model, or other useful fields
                if (firstItem.summary) return firstItem.summary.substring(0, maxLength);
                if (firstItem.model) return firstItem.model;
                if (firstItem.collection) return firstItem.collection;
                if (firstItem.gender) return firstItem.gender;

                // If no useful fields, return first non-empty string value
                for (const item of value) {
                    if (typeof item === 'string' && item.trim()) {
                        return item.substring(0, maxLength);
                    }
                    if (typeof item === 'object' && item !== null) {
                        for (const [key, val] of Object.entries(item)) {
                            if (typeof val === 'string' && val.trim()) {
                                return val.substring(0, maxLength);
                            }
                        }
                    }
                }

                return 'Multiple items';
            }

            // If array contains simple values, join them
            return value.map(v => GoHubTransformer._cleanValue(v, 50)).join(', ').substring(0, maxLength);
        }

        if (typeof value === 'object') {
            // Try to extract useful information from object
            if (value.value !== undefined) {
                return GoHubTransformer._cleanValue(value.value, maxLength);
            }

            if (value.summary) return value.summary.substring(0, maxLength);
            if (value.model) return value.model;
            if (value.collection) return value.collection;
            if (value.gender) return value.gender;

            // If object has a toString method, use it
            if (value.toString && typeof value.toString === 'function') {
                const str = value.toString();
                if (str !== '[object Object]') {
                    return str.substring(0, maxLength);
                }
            }

            // Last resort: return key-value pairs
            const pairs = Object.entries(value)
                .filter(([k, v]) => v !== null && v !== undefined && v !== '')
                .map(([k, v]) => `${k}:${GoHubTransformer._cleanValue(v, 30)}`)
                .join(' ');

            return pairs.substring(0, maxLength) || 'Object data';
        }

        return 'Unknown value';
    }

    /**
     * Analyze GoHub mapping coverage
     */
    static analyzeMappingCoverage(enhancedRows, targetSchema) {
        if (enhancedRows.length === 0) return { coverage: 0, mappedFields: 0, totalFields: 0 };

        const sampleRow = enhancedRows[0];
        const sourceFields = Object.keys(sampleRow);
        const targetFields = Object.keys(targetSchema);

        let mappedFields = 0;
        const mappedSourceFields = [];

        // Check which source fields can be mapped
        sourceFields.forEach(sourceField => {
            if (this.canMapToGoHub(sourceField, targetSchema)) {
                mappedFields++;
                mappedSourceFields.push(sourceField);
            }
        });

        const coverage = Math.round((mappedFields / targetFields.length) * 100);

        return {
            coverage,
            mappedFields,
            totalFields: targetFields.length,
            mappedSourceFields,
            unmappedSourceFields: sourceFields.filter(f => !mappedSourceFields.includes(f))
        };
    }

    /**
     * Check if a source field can be mapped to GoHub
     */
    static canMapToGoHub(sourceField, targetSchema) {
        const fieldLower = sourceField.toLowerCase();

        // Fields that can be mapped
        const mappableFields = [
            'sku', 'upc', 'color', 'size', 'description', 'frameMaterial',
            'composition', 'polarized', 'image1', 'recommendedPrice', 'price',
            'frameType', 'frameShape', 'rimType', 'hingeType'
        ];

        return mappableFields.some(field => fieldLower.includes(field));
    }
}

export default GoHubTransformer; 