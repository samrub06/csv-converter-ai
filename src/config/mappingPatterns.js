/**
 * Mapping Patterns Configuration
 * Centralized dictionary for input header to schema field mapping patterns
 * Simple key-value structure for easy maintenance and reuse
 */

export const MAPPING_PATTERNS = {
    // Universal patterns (most common first)
    sku: ['reference', 'sku', 'ref', 'id', 'product_id', 'item_id', 'code', 'product_code', 'item_code'],
    brand: ['brand', 'manufacturer', 'supplier'],
    description: ['description', 'title', 'product_name'],
    price: ['price', 'cost', 'gohub_price', 'gohubprice'],
    recommendedPrice: ['recommended_price', 'pvp', 'retail_price', 'retailprice', 'msrp', 'rrp'],
    weight: ['weight'],
    upc: ['ean', 'upc', 'barcode'],
    
    // Frame-specific patterns
    color: ['frame_color', 'framecolor', 'color', 'colour'],
    colorDescription: ['color_description', 'color_desc', 'frame_color_desc', 'colour_description'],
    frameMaterial: ['composition', 'characteristics', 'material', 'frame_material', 'framematerial'],
    frameShape: ['shape', 'frame_shape', 'frameshape'],
    frameType: ['type', 'frame_type', 'frametype'],
    collection: ['collection', 'line', 'series'],
    manufacturerModel: ['model', 'model_name', 'name'],
    image1: ['image1', 'image', 'link', 'links', 'photo', 'url'],
    processingDays: ['processing_days', 'lead_time', 'delivery'],
    
    // Size-related patterns
    size: ['lens_width', 'lenswidth', 'width', 'size'],
    bridgeWidth: ['bridge_width', 'bridgewidth', 'bridge'],
    templeLength: ['temple_length', 'templelength', 'temple', 'arms'],
    lensHeight: ['lens_height', 'lensheight', 'height'],
    
    // Frame structure patterns
    rimType: ['rim_type', 'rimtype'],
    hingeType: ['hinge_type', 'hingetype'],
    gender: ['gender'],
    season: ['season'],
    frameCategory: ['frame_category', 'framecategory', 'category'],
    
    // Lens-specific patterns
    index: ['index', 'indice'],
    coating: ['coating', 'treatment'],
    photochromic: ['photochromic', 'photo'],
    polarized: ['polarized', 'polarised'],
    
    // Contact lens-specific patterns
    baseCurve: ['base_curve', 'curve'],
    diameter: ['diameter', 'dia'],
    waterContent: ['water_content', 'hydration'],
    
    // Additional common patterns
    customsCode: ['customs_code', 'customscode', 'custom code', 'customcode'],
    quantity: ['quantity', 'qty'],
};

// Helper function to get patterns for a specific field
export const getPatternsForField = (fieldKey) => {
    return MAPPING_PATTERNS[fieldKey] || [];
};

// Helper function to check if a header matches any pattern for a field
export const headerMatchesField = (header, fieldKey) => {
    const patterns = getPatternsForField(fieldKey);
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
    
    return patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase().replace(/[_\s-]/g, '');
        return normalizedHeader === normalizedPattern || 
               normalizedHeader.includes(normalizedPattern) ||
               normalizedPattern.includes(normalizedHeader);
    });
};

// Helper function to find the best matching field for a header
export const findBestMatchingField = (header) => {
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
    
    for (const [fieldKey, patterns] of Object.entries(MAPPING_PATTERNS)) {
        for (const pattern of patterns) {
            const normalizedPattern = pattern.toLowerCase().replace(/[_\s-]/g, '');
            if (normalizedHeader === normalizedPattern || 
                normalizedHeader.includes(normalizedPattern) ||
                normalizedPattern.includes(normalizedHeader)) {
                return fieldKey;
            }
        }
    }
    
    return null;
};

// Helper function to get all available field keys
export const getAllFieldKeys = () => {
    return Object.keys(MAPPING_PATTERNS);
}; 