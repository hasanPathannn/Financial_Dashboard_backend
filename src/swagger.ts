// src/swagger.ts
export const swaggerDocument = {
  "openapi": "3.0.0",
  "info": {
    "title": "Finance Dashboard API",
    "version": "1.0.0",
    "description": "API documentation for the Finance Data Processing and Access Control Backend."
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Local Development Server"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/api/auth/register": {
      "post": {
        "summary": "Register a new user",
        "tags": ["Authentication"],
        "security": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string", "example": "user@test.com" },
                  "password": { "type": "string", "example": "password123" },
                  "role": { "type": "string", "example": "ADMIN" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "User registered successfully" }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "summary": "Login and get JWT token",
        "tags": ["Authentication"],
        "security": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string", "example": "user@test.com" },
                  "password": { "type": "string", "example": "password123" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Successful login returns token" }
        }
      }
    },
    "/api/records": {
      "get": {
        "summary": "Get all financial records (with filters)",
        "tags": ["Financial Records"],
        "parameters": [
          { "name": "type", "in": "query", "schema": { "type": "string" }, "description": "INCOME or EXPENSE" },
          { "name": "category", "in": "query", "schema": { "type": "string" } }
        ],
        "responses": { "200": { "description": "List of records" } }
      },
      "post": {
        "summary": "Create a new financial record",
        "tags": ["Financial Records"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "amount": { "type": "number", "example": 5000 },
                  "type": { "type": "string", "example": "INCOME" },
                  "category": { "type": "string", "example": "Salary" },
                  "notes": { "type": "string", "example": "Monthly paycheck" }
                }
              }
            }
          }
        },
        "responses": { "201": { "description": "Record created" } }
      }
    },
    "/api/records/{id}": {
      "put": {
        "summary": "Update a record",
        "tags": ["Financial Records"],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
          "content": { "application/json": { "schema": { "type": "object", "properties": { "amount": { "type": "number", "example": 6000 } } } } }
        },
        "responses": { "200": { "description": "Record updated" } }
      },
      "delete": {
        "summary": "Delete a record",
        "tags": ["Financial Records"],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "204": { "description": "Record deleted" } }
      }
    },
    "/api/dashboard/summary": {
      "get": {
        "summary": "Get dashboard aggregations",
        "tags": ["Dashboard"],
        "responses": { "200": { "description": "Returns totals and net balance" } }
      }
    },
    "/api/users/{id}/status": {
      "put": {
        "summary": "Change user status (Admin only)",
        "tags": ["User Management"],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "type": "object", "properties": { "status": { "type": "string", "example": "INACTIVE" } } } } }
        },
        "responses": { "200": { "description": "User status updated" } }
      }
    }
  }
}; 