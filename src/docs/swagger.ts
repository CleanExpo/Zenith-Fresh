import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zenith API Documentation',
      version: '1.0.0',
      description: 'API documentation for Zenith SaaS Platform',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://zenith.engineer',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

// Swagger UI setup
export const swaggerUi = require('swagger-ui-express'); 