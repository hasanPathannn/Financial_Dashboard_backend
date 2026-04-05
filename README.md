# Finance Data Processing and Access Control Backend

## 🎯 Objective
This is a robust, modular backend designed for a finance dashboard system. It handles user management, role-based access control (RBAC), and secure financial record processing. 

The architecture prioritizes **maintainability, clean separation of concerns, and type safety**, simulating a production-ready environment while remaining lightweight for easy assessment review.

## 🛠 Tech Stack
* **Language:** TypeScript
* **Framework:** Node.js + Express.js
* **Database:** SQLite (Chosen for zero-configuration reviewer setup)
* **ORM:** Prisma
* **Authentication:** JSON Web Tokens (JWT) + bcryptjs
* **Validation:** Zod

## ✨ Key Features
1. **Modular Architecture:** Clean separation between Routes, Controllers, Middlewares, and configuration.
2. **Role-Based Access Control (RBAC):** Custom middleware enforcing `VIEWER`, `ANALYST`, and `ADMIN` permissions.
3. **User Management:** Secure registration, login, and Admin-controlled account activation/deactivation (`ACTIVE`/`INACTIVE`).
4. **Financial CRUD & Filtering:** Complete record management with dynamic query filtering (by type, category, and date range).
5. **Dashboard Aggregations:** Highly efficient SQL-level data aggregation via Prisma for calculating net balances and category breakdowns.
6. **Robust Validation:** Strict runtime type-checking and payload validation using Zod to prevent bad data from hitting the database.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install