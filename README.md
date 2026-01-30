# BellBooking — Professional Booking System Template

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Status](https://img.shields.io/badge/status-ready_to_clone-green) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

**BellBooking** is an open-core, architecture-first booking system template designed for scalability and maintainability. It follows **Domain-Driven Design (DDD)** and **Hexagonal Architecture** principles, separating the immutable core from custom business logic and UI.

## 🚀 Features

*   **Immutable Core (M1)**: Robust scheduling engine handling time zones, exclusions, and finite state machines.
*   **Extensible Policies (M2)**: Rule engine for validating bookings (LeadTime, MaxAdvance, etc.) without modifying the core.
*   **Dynamic Configuration (M3)**: JSON-based configuration with database overrides and fail-fast validation.
*   **Reusable UI Core (M6)**: A headless, policy-driven UI kit for building wizard-like booking flows.
*   **Template Scaffolding (M4)**: Scripts and structure to spin up new client projects in < 15 minutes.
*   **Operational Excellence (M5)**: Audit logging, performance patterns, and security hardening out of the box.

## 📂 Project Structure

```
src/
├── modules/
│   ├── booking/       # 🔒 CORE DOMAIN (Do not touch)
│   └── custom/        # ✅ CUSTOM EXTENSIONS (Your logic here)
├── ui-core/           # 🔒 UI COMPONENTS (Reusable, vertical-agnostic)
├── ui-verticals/      # ✅ VERTICAL EXAMPLES (Dentist, Sports, etc.)
└── ui-client/         # ✅ CLIENT BRANDING (Themes, Copy)
seeds/                 # 🌱 Configuration seeds
docs/                  # 📚 Documentation
```

## 🛠️ Getting Started

### Prerequisites

*   Node.js >= 18
*   Supabase CLI
*   NPM

### 1. Clone & Bootstrap

```bash
# Clone the template
git clone https://github.com/your-org/bellbooking-template.git my-project
cd my-project

# Remove git history to start fresh
rm -rf .git
git init
```

### 2. Configure Environment

```bash
cp .env.example .env.development
# Update SUPABASE_URL and SUPABASE_ANON_KEY in .env.development
```

### 3. Install & Seed

```bash
npm install
npx supabase db push  # Apply migrations
npm run seed:config   # Load base configuration
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` (or configured port).

## 📘 Documentation

*   [Architecture Overview](docs/ARCHITECTURE.md)
*   [Configuration Guide](docs/CONFIG.md)
*   [Customization Guide](docs/CUSTOMIZATION.md)
*   [Security Hardening](docs/SECURITY.md)
*   [Operations & Audit](docs/OPERATIONS.md)
*   [UI Core System](docs/UI_CORE.md)

## ⚖️ License

MIT. See `LICENSE` for details.
