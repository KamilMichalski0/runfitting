const swaggerJsdoc = require('swagger-jsdoc');
const TrainingFormSubmission = require('../models/running-form.model');
const TrainingPlan = require('../models/training-plan.model'); // Dodaj import dla Planu
const mongoose = require('mongoose');

// Przeniesiona funkcja pomocnicza
// UWAGA: Ta funkcja jest uproszczona i może wymagać ulepszeń
// do obsługi bardziej złożonych schematów Mongoose.
function generateOpenApiSchema(mongooseSchema) {
  const properties = {};
  const required = [];

  mongooseSchema.eachPath((pathname, schemaType) => {
    // Skip internal fields
    if (pathname === '_id' || pathname === '__v' || pathname === 'userId' || pathname === 'status' || pathname === 'planId' || pathname === 'createdAt' || pathname === 'updatedAt') {
      // Keep planId for TrainingFormSubmission response schema?
      if (mongooseSchema.modelName === 'TrainingFormSubmission' && pathname === 'planId') {
         // Keep planId
      } else {
         return;
      }
    }

    const options = schemaType.options;
    const property = {};

    switch (schemaType.instance) {
      case 'String':
        property.type = 'string';
        if (options.enum) property.enum = options.enum;
        if (options.minLength) property.minLength = options.minLength;
        if (options.maxLength) property.maxLength = options.maxLength;
        if (options.lowercase) property.format = 'email'; // Basic assumption
        if (options.match) property.pattern = options.match.source;
        break;
      case 'Number':
        property.type = 'number';
        if (options.min !== undefined) property.minimum = options.min;
        if (options.max !== undefined) property.maximum = options.max;
        break;
      case 'Boolean':
        property.type = 'boolean';
        break;
      case 'Date':
        property.type = 'string';
        property.format = 'date-time';
        break;
      case 'Array':
        property.type = 'array';
        if (schemaType.$embeddedSchemaType) {
          // Basic handling for embedded schemas within arrays
          const itemSchema = generateOpenApiSchema(new mongoose.Schema({ item: schemaType.$embeddedSchemaType }));
          property.items = itemSchema.properties.item; // Extract the generated item schema
          if (property.items.properties && Object.keys(property.items.properties).length === 0) {
             // Fallback if nested generation fails
              if (schemaType.$embeddedSchemaType.instance === 'String') {
                 property.items = { type: 'string' };
                 if (schemaType.$embeddedSchemaType.options.enum) {
                     property.items.enum = schemaType.$embeddedSchemaType.options.enum;
                 }
              } else if (schemaType.$embeddedSchemaType.instance === 'Number') {
                  property.items = { type: 'number' };
              } else {
                 property.items = { type: 'object' };
              }
          }
        } else if (options.type && options.type[0] && options.type[0].ref) {
          // Handle array of references
          property.items = { type: 'string', format: 'objectid' }; // Represent refs as strings
        } else {
           property.items = { type: 'string' }; // Default for simple arrays like [String]
        }
        if (options.minlength) property.minItems = options.minlength;
        if (options.maxlength) property.maxItems = options.maxlength;
        break;
      case 'ObjectId':
         // Represent ObjectId as string in OpenAPI schema
         property.type = 'string';
         property.format = 'objectid';
         break;
      case 'Map':
         property.type = 'object';
         // OpenAPI doesn't directly support Map, represent as object
         // You might need 'additionalProperties' depending on Map content
         property.additionalProperties = { type: 'string' }; // Example, adjust based on Map value type
         break;
      case 'Mixed': // mongoose.Schema.Types.Mixed
         property.type = 'object';
         // Allow any structure for Mixed type
         property.additionalProperties = true;
         break;
      default:
         // Try to handle nested schemas (Schema in Schema)
         if (schemaType.schema) {
            const nestedSchema = generateOpenApiSchema(schemaType.schema);
            property.type = 'object';
            property.properties = nestedSchema.properties;
            if (nestedSchema.required && nestedSchema.required.length > 0) {
                property.required = nestedSchema.required;
            }
         } else {
            property.type = 'object'; // Fallback
         }
    }

    if (options.required && typeof options.required !== 'function') {
      required.push(pathname);
    }
    if (options.description) {
      property.description = options.description;
    }
    if (options.example) {
        property.example = options.example;
    }
    if (options.default !== undefined) {
        property.default = options.default;
    }

    properties[pathname] = property;
  });

  // Handle virtuals (like BMI) - should generally be readOnly
  if (mongooseSchema.virtuals) {
      for (const virtualName in mongooseSchema.virtuals) {
          // Basic handling - assuming virtuals return simple types
          // Add specific logic if virtuals are complex
          if (virtualName === 'bmi') { // Example
             properties[virtualName] = { type: 'number', readOnly: true, description: 'Calculated Body Mass Index' };
          }
          // Add other virtuals if needed
      }
  }

  return {
    type: 'object',
    properties: properties,
    ...(required.length > 0 && { required: required }),
  };
}

// Generowanie schematów dla modeli
const trainingFormSubmissionSchemaForApi = generateOpenApiSchema(TrainingFormSubmission.schema);
const trainingPlanSchemaForApi = generateOpenApiSchema(TrainingPlan.schema);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'RunFitting API',
      version: '1.0.0',
      description: 'API Documentation for the RunFitting application',
      contact: {
        name: 'Support Team',
        // url: 'http://yourwebsite.com',
        // email: 'support@yourwebsite.com',
      },
    },
    servers: [
      {
        url: '/api', // Base path for all API routes
        description: 'Development server',
      },
      // Add other servers like production if needed
    ],
    components: {
      schemas: {
        // Tutaj dodajemy dynamicznie wygenerowane schematy
        TrainingFormSubmission: trainingFormSubmissionSchemaForApi,
        TrainingPlan: trainingPlanSchemaForApi,
        // Możesz tutaj dodać ręcznie inne schematy lub odpowiedzi, np. błędy
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found'
            },
            details: {
              type: 'object',
              description: 'Optional error details'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Apply bearerAuth globally by default, can be overridden per operation
      },
    ],
  },
  // Ścieżki do plików zawierających adnotacje @openapi
  apis: ['./src/routes/**/*.js', './src/controllers/**/*.js'], // Include controllers if they contain OpenAPI comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec; 