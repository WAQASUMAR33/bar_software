# 🍦 Holiday Ice Cream – POS System

A complete, production-ready **Point of Sale** system built with **Next.js (JavaScript)**, **Prisma ORM**, and **MySQL**.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (Pages Router, JS only)  |
| Styling    | Tailwind CSS                        |
| Backend    | Next.js API Routes                  |
| ORM        | Prisma 5                            |
| Database   | MySQL 8                             |
| Auth       | JWT + httpOnly Cookies              |
| Charts     | Recharts                            |
| PDF Export | jsPDF + jspdf-autotable             |
| Excel      | xlsx                                |
| Print      | react-to-print                      |

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MySQL 8+ running locally

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your MySQL credentials:
# DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/holiday_ice_cream_pos"
# JWT_SECRET=your-secret-key
```

### 4. Set up the database
```bash
# Push the Prisma schema to MySQL (creates DB + all tables)
npm run db:push

# Seed with demo data (products, users, categories, settings)
npm run db:seed
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Login Credentials

| Role    | Email                            | Password  |
|---------|----------------------------------|-----------|
| Admin   | admin@holidayicecream.com        | admin123  |
| Manager | manager@holidayicecream.com      | admin123  |
| Cashier | cashier@holidayicecream.com      | admin123  |

---

## Modules

| Module            | Path            | Access            |
|-------------------|-----------------|-------------------|
| Dashboard         | /dashboard      | All roles         |
| Billing / POS     | /billing        | All roles         |
| Sales Reports     | /reports        | Admin, Manager    |
| Customers         | /customers      | All roles         |
| Customer Ledger   | /ledger         | Admin, Manager    |
| Payments          | /payments       | Admin, Manager    |
| Products / Menu   | /products       | Admin, Manager    |
| Categories        | /categories     | Admin, Manager    |
| Inventory         | /inventory      | Admin, Manager    |
| Expenses          | /expenses       | Admin, Manager    |
| Users & Roles     | /users          | Admin only        |
| Settings          | /settings       | Admin only        |

---

## Database Commands

```bash
npm run db:push      # Apply schema to DB
npm run db:migrate   # Create a tracked migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:generate  # Re-generate Prisma Client
```

---

## Production Build

```bash
npm run build
npm start
```
# bar_software
