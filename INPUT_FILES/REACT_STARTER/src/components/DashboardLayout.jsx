import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';

import SalesStatCard from './SalesStatCard.jsx';
import TransactionsTable from './TransactionsTable.jsx';
import SalesAnalytics from './SalesAnalytics.jsx';

// API base URL
const API_BASE_URL = `http://${window.location.hostname}:4177`;

// Parse transaction dates
const parseTransactionDate = (dateString) => {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateString);

  if (isNaN(parsed.getTime())) return null;

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Date range helper
const getRangeStart = (range) => {
  const today = startOfDay(new Date());

  if (range === '7days') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return start;
  }

  if (range === '30days') {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return start;
  }

  if (range === 'month') {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return null;
};

// Normalize API transaction data for the dashboard components
const normalizeTransaction = (transaction) => ({
  ...transaction,
  id: transaction.transactionId || transaction.id,
  amount: Number(transaction.amount) || 0,
  quantity: Number(transaction.quantity) || 0,
  unitPrice: Number(transaction.unitPrice) || 0,
});

export default function DashboardLayout() {
  // Transactions fetched from API
  const [transactionList, setTransactionList] = useState([]);

  // API statistics
  const [apiStats, setApiStats] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Retry trigger
  const [retryCount, setRetryCount] = useState(0);

  // Date filter
  const [dateRange, setDateRange] = useState('all');

  // Fetch API data
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsResponse, transactionsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/stats`),
          fetch(`${API_BASE_URL}/api/transactions`),
        ]);

        if (!statsResponse.ok) {
          throw new Error('Failed to load dashboard statistics.');
        }

        if (!transactionsResponse.ok) {
          throw new Error('Failed to load transactions.');
        }

        const statsData = await statsResponse.json();
        const transactionsData = await transactionsResponse.json();

        // API transactions may be returned inside a transactions property
        const rawTransactions = Array.isArray(transactionsData)
          ? transactionsData
          : transactionsData.transactions;

        if (!Array.isArray(rawTransactions)) {
          throw new Error('Invalid transactions data received from API.');
        }

        const normalizedTransactions = rawTransactions.map(
          normalizeTransaction
        );

        if (isMounted) {
          setApiStats(statsData);
          setTransactionList(normalizedTransactions);
          setError('');
        }
      } catch (err) {
        console.error('Dashboard API error:', err);

        if (isMounted) {
          setError(
            err.message ||
              'Unable to connect to the API. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  // Retry API request
  const handleRetry = () => {
    setRetryCount((previous) => previous + 1);
  };

  // Filter transactions by date
  const rangeStart = getRangeStart(dateRange);
  const today = startOfDay(new Date());

  const filteredTransactions = transactionList.filter((item) => {
    if (dateRange === 'all') return true;

    const transactionDate = parseTransactionDate(item.date);

    if (!transactionDate || !rangeStart) return false;

    return transactionDate >= rangeStart && transactionDate <= today;
  });

  // Total Sales - only Completed transactions
  const calculatedSales = filteredTransactions
    .filter((item) => item.status === 'Completed')
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);

  // Active Orders - Pending + Processing transactions
  const calculatedActiveOrders = filteredTransactions.filter(
    (item) =>
      item.status === 'Pending' || item.status === 'Processing'
  ).length;

  // Transaction Count
  const calculatedTransactionCount = filteredTransactions.length;

  // Dashboard summary values from the current transaction list
const totalSales = calculatedSales;

const activeOrders = calculatedActiveOrders;

const totalTransactions = calculatedTransactionCount;

  // Currency formatter
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: apiStats?.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  // Add transaction
  const handleAddTransaction = (newTransaction) => {
    setTransactionList((previousTransactions) => [
      normalizeTransaction(newTransaction),
      ...previousTransactions,
    ]);
  };

  // Edit transaction
  const handleEditTransaction = (updatedTransaction) => {
    setTransactionList((previousTransactions) =>
      previousTransactions.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? normalizeTransaction(updatedTransaction)
          : transaction
      )
    );
  };

  // Delete transaction
  const handleDeleteTransaction = (transactionId) => {
    setTransactionList((previousTransactions) =>
      previousTransactions.filter(
        (transaction) => transaction.id !== transactionId
      )
    );
  };

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>J</div>
          <div>
            <h2>Jyoti Insights</h2>
            <span>SALES MANAGEMENT</span>
          </div>
        </div>

        <p className={styles.navLabel}>MENU</p>

        <nav className={styles.navigation}>
          <a href="#overview" className={styles.activeLink}>
            <span className={styles.navIcon}>▦</span>
            Overview
          </a>
        </nav>

        {/* Admin Profile */}
        <div className={styles.sidebarBottom}>
          <div className={styles.profile}>
            <div className={styles.avatar}>JI</div>
            <div>
              <strong>Administrator</strong>
              <span>Sales Manager</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main id="overview" className={styles.main}>
        {/* HEADER */}
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>Workspace / Overview</p>
            <h1>Sales Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back! Here's what's happening with your sales.
            </p>
          </div>

          {/* Date Filter */}
          <div className={styles.dateBadge}>
            ◷ &nbsp;
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter dashboard by date"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'inherit',
                fontSize: 'inherit',
              }}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </header>

        {/* API LOADING */}
        {loading && (
          <div
            role="status"
            style={{
              padding: '14px 18px',
              marginBottom: '20px',
              borderRadius: '10px',
              background: '#eef5ff',
              color: '#2458a6',
            }}
          >
            Loading dashboard data from API...
          </div>
        )}

        {/* API ERROR */}
        {!loading && error && (
          <div
            role="alert"
            style={{
              padding: '16px 18px',
              marginBottom: '20px',
              borderRadius: '10px',
              background: '#fff1f1',
              color: '#b42318',
            }}
          >
            <strong>Unable to load dashboard data.</strong>
            <p style={{ margin: '8px 0' }}>{error}</p>

            <button
              type="button"
              onClick={handleRetry}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #b42318',
                background: '#ffffff',
                color: '#b42318',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className={styles.cards}>
          <SalesStatCard
            label="Total Sales"
            value={formatCurrency(totalSales)}
            note="Revenue from completed transactions"
            icon="₹"
            variant="sales"
          />

          <SalesStatCard
            label="Active Orders"
            value={activeOrders.toString()}
            note="Pending and processing orders"
            icon="↗"
            variant="orders"
          />

          <SalesStatCard
            label="Transactions"
            value={totalTransactions.toString()}
            note="Transactions in selected period"
            icon="#"
            variant="transactions"
          />
        </section>

        {/* ANALYTICS */}
        <SalesAnalytics transactions={filteredTransactions} />


        {/* TRANSACTIONS TABLE */}
        <section className={styles.transactionSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Recent Transactions</h2>
              <p>View and manage your latest sales activity.</p>
            </div>
          </div>

          <TransactionsTable
            transactions={transactionList}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          © 2026 Jyoti Insights · Sales Administration
        </footer>
      </main>
    </div>
  );
}