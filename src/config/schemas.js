/**
 * GoHub Standard Schemas Configuration
 * Centralized dictionary for all product type schemas
 * Simple key-value structure for easy maintenance and reuse
 */

export const GOHUB_SCHEMAS = {
    // Frame product schema
    FRAME: {
        brand: 'Brand',
        frameCategory: 'Frame category',
        sku: 'SKU',
        description: 'Description',
        collection: 'Collection',
        gender: 'Gender',
        frameType: 'Frame type',
        frameMaterial: 'Frame material',
        frameShape: 'Frame shape',
        color: 'Color',
        colorDescription: 'Color description',
        lensWidth: 'Lens width',
        bridgeWidth: 'Bridge width',
        templeLength: 'Temple length',
        lensHeight: 'Lens height',
        rimType: 'Rim type',
        hingeType: 'Hinge type',
        manufacturerModel: 'Manufacturer model #',
        upc: 'UPC',
        season: 'Season',
        weight: 'Weight',
        recommendedPrice: 'Recommended Price',
        price: 'Price',
        processingDays: 'Processing days',
        image1: 'Image1',
        image2: 'Image2',
        image3: 'Image3'
    },

    // Lens product schema
    LENS: {
        opticalSolution: 'OpticalSolution',
        solution: 'Solution',
        opticalDesign: 'OpticalDesign',
        index: 'Index',
        diameter: 'Diameter',
        coating: 'Coating',
        treatment: 'Treatment',
        treatmentColor: 'TreatmentColor',
        photochromic: 'Photochromic',
        ar: 'AR',
        sku: 'SKU',
        supplierName: 'SupplierName',
        weight: 'Weight',
        price: 'Price',
        processingDays: 'ProcessingDays',
        sphereRangeMin: 'SphereRangeMin',
        sphereRangeMax: 'SphereRangeMax',
        cylinderRangeMin: 'CylinderRangeMin',
        cylinderRangeMax: 'CylinderRangeMax',
        addRangeMin: 'AddRangeMin',
        addRangeMax: 'AddRangeMax'
    },

    // Complete eyeglasses schema
    EYE_GLASSES: {
        brand: 'Brand',
        sku: 'SKU',
        description: 'Description',
        frameSku: 'Frame SKU',
        lensSku: 'Lens SKU',
        gender: 'Gender',
        frameMaterial: 'FrameMaterial',
        frameShape: 'FrameShape',
        color: 'Color',
        lensType: 'LensType',
        index: 'Index',
        coating: 'Coating',
        ar: 'AR',
        photochromic: 'Photochromic',
        sphereRangeMin: 'SphereRangeMin',
        sphereRangeMax: 'SphereRangeMax',
        cylinderRangeMin: 'CylinderRangeMin',
        cylinderRangeMax: 'CylinderRangeMax',
        addRangeMin: 'AddRangeMin',
        addRangeMax: 'AddRangeMax',
        pdRangeMin: 'PDRangeMin',
        pdRangeMax: 'PDRangeMax',
        price: 'Price',
        processingDays: 'ProcessingDays',
        weight: 'Weight',
        image1: 'Image1',
        image2: 'Image2'
    },

    // Contact lens schema
    CONTACT_LENS: {
        brand: 'Brand',
        sku: 'SKU',
        description: 'Description',
        lensModality: 'LensModality',
        wearSchedule: 'WearSchedule',
        replacementSchedule: 'ReplacementSchedule',
        material: 'Material',
        waterContent: 'WaterContent',
        oxygenPermeability: 'OxygenPermeability',
        baseCurve: 'BaseCurve',
        diameter: 'Diameter',
        powerRangeMin: 'PowerRangeMin',
        powerRangeMax: 'PowerRangeMax',
        cylinderRangeMin: 'CylinderRangeMin',
        cylinderRangeMax: 'CylinderRangeMax',
        axisSteps: 'AxisSteps',
        addPowerOptions: 'AddPowerOptions'
    }
};

// Helper function to get schema keys for a product type
export const getSchemaKeys = (productType) => {
    return Object.keys(GOHUB_SCHEMAS[productType] || {});
};

// Helper function to get schema values for a product type
export const getSchemaValues = (productType) => {
    return Object.values(GOHUB_SCHEMAS[productType] || {});
};

// Helper function to get full schema for a product type
export const getSchema = (productType) => {
    return GOHUB_SCHEMAS[productType] || {};
};

// Helper function to check if a field exists in a schema
export const hasField = (productType, fieldKey) => {
    return GOHUB_SCHEMAS[productType] && fieldKey in GOHUB_SCHEMAS[productType];
};

// Helper function to get the standard field name for a given key
export const getStandardFieldName = (productType, fieldKey) => {
    return GOHUB_SCHEMAS[productType]?.[fieldKey] || null;
}; 