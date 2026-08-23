# AI Prompt Log

This file documents the AI assistance used during development of the Car Dealership Inventory System.

## ChatGPT

AI tool used: ChatGPT

### Prompt 1 — Backend API Development

Build a full-stack Car Dealership Inventory System using Node.js, TypeScript, Express, PostgreSQL, Prisma, React, and Tailwind CSS. The backend should provide authentication, vehicle management, inventory management, JWT authentication, and role-based authorization for ADMIN and USER roles.

### Prompt 2 — Vehicle API

Help me implement the REST API endpoints for the car dealership inventory system, including creating, listing, searching, updating, deleting, purchasing, and restocking vehicles. Admin-only operations should be protected using JWT authentication and role-based authorization.

### Prompt 3 — Admin Authentication

I need to create an admin user for my Car Dealership Inventory System so that I can test the admin dashboard. The project uses Prisma, PostgreSQL, bcrypt, JWT authentication, and ADMIN/USER roles.

### Prompt 4 — Debugging Admin Login

I created the admin user successfully, but I am getting an internal server error when trying to log in and access the admin dashboard. Help me debug the authentication and backend issue.

### Prompt 5 — Debugging Vehicle Creation

The backend is returning this error:

Cannot destructure property 'vin' of 'req.body' as it is undefined.

Help me identify why the request body is undefined and fix the frontend/backend API integration.

### Prompt 6 — Frontend API Integration

Review my React frontend API code for creating, updating, deleting, and restocking vehicles. Make sure JWT authentication is correctly included in the requests and that JSON request bodies are sent correctly.

### Prompt 7 — User Authorization Testing

I need to test a normal USER account and make sure the user can view vehicles, search vehicles, and purchase vehicles, but cannot access admin-only operations such as adding, updating, deleting, or restocking vehicles.

### Prompt 8 — Automated Testing

Help me run and debug the Jest and Supertest test suite for my Node.js/TypeScript backend. I currently have authentication, vehicle, dealership, and inventory tests.

### Prompt 9 — Test Environment Debugging

My Jest tests are failing with:

DIRECT_DATABASE_URL is required

The backend uses Prisma and a PostgreSQL database. Help me configure the test environment so Jest can access the required environment variables.

### Prompt 10 — Debugging Failed Tests

My backend test suite has multiple failing tests returning 401 Unauthorized. Help me identify whether the issue is authentication, JWT tokens, test users, or the test setup.

### Prompt 11 — Test Suite Verification

My backend test suite now reports:

Test Suites: 5 passed, 5 total
Tests: 52 passed, 52 total

Help me verify what this means for the testing requirements of my Car Dealership Inventory System.

### Prompt 12 — Project Documentation

Help me prepare a README.md for my Car Dealership Inventory System that includes the project overview, technology stack, setup instructions, API endpoints, testing results, screenshots section, and AI usage documentation.

### Prompt 13 — Assignment Completion Check

Review the Car Dealership Inventory System assignment requirements and help me identify which requirements are completed and which submission requirements still need to be completed.