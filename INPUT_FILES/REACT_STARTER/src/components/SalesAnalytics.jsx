import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import styles from '../styles/Dashboard.module.css';

// Status colors
const STATUS_COLORS = {
  Completed: '#20A486',
  Pending: '#E9A23B',
  Processing: '#5685E5',
  Refunded: '#DF6868',
};

// Currency formatter
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

// Date formatter
const formatChartDate = (dateString) => {
  if (!dateString) return '';

  // ISO date: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  // Existing format: 22 Nov 2026
  return dateString.split(' ').slice(0, 2).join(' ');
};

// Date sorting helper
const getDateValue = (dateString) => {
  if (!dateString) return 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export default function SalesAnalytics({ transactions = [] }) {
  // Daily Completed Sales Aggregation
  const dailySales = Object.values(
    transactions
      .filter((item) => item.status === 'Completed')
      .reduce((acc, item) => {
        const key = item.date;

        if (!acc[key]) {
          acc[key] = {
            rawDate: key,
            date: formatChartDate(key),
            sales: 0,
          };
        }

        acc[key].sales += Number(item.amount) || 0;

        return acc;
      }, {})
  ).sort((a, b) => getDateValue(a.rawDate) - getDateValue(b.rawDate));

  // All API transaction statuses
  const statusNames = [
    'Completed',
    'Pending',
    'Processing',
    'Refunded',
  ];

  // Payment status aggregation
  const paymentStatus = statusNames.map((status) => ({
    name: status,
    value: transactions.filter((item) => item.status === status).length,
  }));

  const totalPayments = transactions.length;

  return (
    <section className={styles.analyticsGrid}>
      {/* DAILY SALES CHART */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h2>Daily Sales Trend</h2>
            <p>Revenue from completed payments</p>
          </div>

          <span className={styles.chartLegend}>
            <span
              className={styles.legendDot}
              style={{ background: STATUS_COLORS.Completed }}
            ></span>
            Completed Sales
          </span>
        </div>

        <div className={styles.chartArea}>
          {dailySales.length === 0 ? (
            <div className={styles.chartEmpty}>
              No completed sales data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailySales}
                margin={{ top: 10, right: 8, left: 8, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="#EDF1F3"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#82919C' }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: '#82919C' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${value / 1000}k` : value
                  }
                />

                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E5ECEF',
                    fontSize: '12px',
                  }}
                />

                <Bar
                  dataKey="sales"
                  name="Completed Sales"
                  fill={STATUS_COLORS.Completed}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* PAYMENT STATUS CHART */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h2>Payment Status</h2>
            <p>Transaction status distribution</p>
          </div>
        </div>

        <div className={styles.donutArea}>
          <div className={styles.donutChart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={4}
                  stroke="none"
                >
                  {paymentStatus.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `${value} transactions`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E5ECEF',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className={styles.donutCenter}>
              <strong>{totalPayments}</strong>
              <span>Transactions</span>
            </div>
          </div>

          {/* STATUS LEGEND */}
          <div className={styles.statusLegend}>
            {paymentStatus.map((item) => (
              <div className={styles.statusLegendRow} key={item.name}>
                <span
                  className={styles.statusLegendColor}
                  style={{ background: STATUS_COLORS[item.name] }}
                ></span>

                <span className={styles.statusLegendName}>
                  {item.name}
                </span>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}