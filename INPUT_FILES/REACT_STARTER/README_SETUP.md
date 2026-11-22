# Jyoti Insights — Sales Dashboard

A responsive sales analytics dashboard built with React and Vite. It displays sales statistics, transaction records, and analytics charts using data fetched from a mock REST API.

## Features

- **Dashboard Summary Cards** — Total Sales, Active Orders, and Total Transactions.
- **Sales Analytics** — Daily sales trend and payment/status distribution charts.
- **Transaction Management** — Add, edit, delete, and view transaction details.
- **Search & Filtering** — Search transactions and filter by transaction status.
- **Date Range Filtering** — Filter dashboard data by date range.
- **CSV Export** — Export transaction records to CSV.
- **Responsive UI** — Dashboard layout adapts to different screen sizes.
- **API Integration** — Fetch sales statistics and transactions from the mock backend.
- **Loading & Error Handling** — Loading states, error messages, and retry functionality.

## Tech Stack

- React
- Vite
- JavaScript
- CSS Modules
- Recharts
- REST API

## Requirements

- Node.js 18+
- npm

## Project Structure

```text
INPUT_FILES/
├── MOCK_API/
│   └── Mock REST API
└── REACT_STARTER/
    └── React Dashboard Frontend
```

## Getting Started

### 1. Start the Mock API

Open a terminal in the `INPUT_FILES/MOCK_API` directory:

```bash
npm install
npm start
```

API base URL:

`http://localhost:4177`

### 2. Start the React Frontend

Open another terminal in the `INPUT_FILES/REACT_STARTER` directory:

```bash
npm install
npm run dev
```

Frontend URL:

`http://localhost:5173`

### API Endpoints

| Endpoint | Description |
|---|---|
| `/health` | API health check |
| `/api/stats` | Sales summary statistics |
| `/api/transactions` | Transaction list |

### Production Build

To create the production build:

```bash
npm run build
```

The generated production files will be available in the `dist` directory.

## Notes

- The mock API currently provides data-fetching endpoints.
- Transaction add, edit, and delete actions are managed in frontend state and are not permanently saved to the backend.
- Refreshing the page reloads data from the API, so locally modified transactions may reset.
- For deployment, configure the backend URL appropriately and enable secure CORS settings on the server.
