/**
 * Configuration Index
 * Centralized export for all configuration files
 */

// Import schemas
import {
  GOHUB_SCHEMAS,
  getSchema,
  getSchemaKeys,
  getSchemaValues,
  getStandardFieldName,
  hasField
} from './schemas.js';

// Import mapping patterns
import {
  MAPPING_PATTERNS,
  findBestMatchingField,
  getAllFieldKeys,
  getPatternsForField,
  headerMatchesField
} from './mappingPatterns.js';

// Export schemas
export {
  GOHUB_SCHEMAS, getSchema, getSchemaKeys,
  getSchemaValues, getStandardFieldName, hasField
};

// Export mapping patterns
  export {
    MAPPING_PATTERNS, findBestMatchingField,
    getAllFieldKeys, getPatternsForField,
    headerMatchesField
  };

// Re-export everything as a single config object for convenience
export const CONFIG = {
    schemas: {
        GOHUB_SCHEMAS,
        getSchemaKeys,
        getSchemaValues,
        getSchema,
        hasField,
        getStandardFieldName
    },
    patterns: {
        MAPPING_PATTERNS,
        getPatternsForField,
        headerMatchesField,
        findBestMatchingField,
        getAllFieldKeys
    }
}; 