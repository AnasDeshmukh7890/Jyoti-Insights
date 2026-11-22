import React, { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.css';

const PRODUCTS = [
  'Night Cream',
  'Lip Balm',
  'Face Mask',
  'Body Lotion',
  'SPF Cream',
  'Vitamin Serum',
  'Daily Moisturizer',
  'Herbal Cleanser',
];

const CHANNELS = ['Marketplace', 'Retail', 'Online'];

const STATUSES = ['Completed', 'Pending', 'Processing', 'Refunded'];

const STATUS_COLORS = {
  Completed: { bg: '#e2f3ee', text: '#087f70' },
  Pending: { bg: '#fff4df', text: '#b77916' },
  Processing: { bg: '#eaf1ff', text: '#4169b1' },
  Refunded: { bg: '#fff0f0', text: '#c43d3d' },
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return date;
};

const toInputDate = (date) => {
  if (!date) return new Date().toISOString().slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const getNextTransactionId = (transactions) => {
  const highestNumber = transactions.reduce((max, item) => {
    const match = String(item.id || item.transactionId || '').match(/TXN-(\d+)/);

    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `TXN-${String(highestNumber + 1).padStart(4, '0')}`;
};

const getInitialForm = () => ({
  customer: '',
  product: 'Night Cream',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Pending',
  channel: 'Online',
  quantity: '1',
  unitPrice: '',
});

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #dce5ea',
  borderRadius: '10px',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#142538',
};

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#526579',
};

export default function TransactionsTable({
  transactions = [],
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState(getInitialForm);
  const [formError, setFormError] = useState('');

  const perPage = 5;

  // Search + status filter
  const filteredTransactions = transactions.filter((transaction) => {
    const searchableText = [
      transaction.id,
      transaction.customer,
      transaction.product,
      transaction.channel,
      transaction.status,
      transaction.date,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;

  const visibleTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + perPage
  );

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Update form values
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError('');
  };

  // Reset form
  const resetTransactionForm = () => {
    setForm(getInitialForm());
    setFormError('');
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  // Add / Edit transaction
  const handleSubmit = (e) => {
    e.preventDefault();

    const customer = form.customer.trim();
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    const amount = quantity * unitPrice;

    if (!customer) {
      setFormError('Please enter the customer name.');
      return;
    }

    if (!form.product) {
      setFormError('Please select a product.');
      return;
    }

    if (!form.date) {
      setFormError('Please select a transaction date.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Quantity must be greater than 0.');
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setFormError('Please enter a valid unit price.');
      return;
    }

    const transactionData = {
      id: editingTransaction?.id || getNextTransactionId(transactions),
      customer,
      product: form.product,
      channel: form.channel,
      date: form.date,
      quantity,
      unitPrice,
      amount,
      status: form.status,
    };

    if (editingTransaction) {
      onEditTransaction?.(transactionData);
    } else {
      onAddTransaction?.(transactionData);
    }

    resetTransactionForm();
    setSearch('');
    setStatusFilter('All');
    setPage(1);
  };

  // Open edit form
  const handleEditClick = () => {
    if (!selectedTransaction) return;

    setEditingTransaction(selectedTransaction);

    setForm({
      customer: selectedTransaction.customer || '',
      product: selectedTransaction.product || PRODUCTS[0],
      amount: String(selectedTransaction.amount ?? ''),
      date: toInputDate(selectedTransaction.date),
      status: selectedTransaction.status || 'Pending',
      channel: selectedTransaction.channel || 'Online',
      quantity: String(selectedTransaction.quantity ?? 1),
      unitPrice: String(
        selectedTransaction.unitPrice ??
          (Number(selectedTransaction.amount) /
            Math.max(1, Number(selectedTransaction.quantity) || 1))
      ),
    });

    setFormError('');
    setSelectedTransaction(null);
    setShowAddModal(true);
  };

  // Delete handling
  const handleDeleteClick = () => {
    if (!selectedTransaction) return;

    setConfirmDelete(selectedTransaction);
    setSelectedTransaction(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    onDeleteTransaction?.(confirmDelete.id);

    setConfirmDelete(null);
    setSearch('');
    setStatusFilter('All');
    setPage(1);
  };

  // CSV export
  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = [
      'Transaction ID',
      'Customer',
      'Product',
      'Channel',
      'Date',
      'Quantity',
      'Unit Price',
      'Amount',
      'Status',
    ];

    const csvEscape = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredTransactions.map((transaction) => [
      transaction.id,
      transaction.customer,
      transaction.product,
      transaction.channel || '',
      transaction.date,
      transaction.quantity ?? 1,
      transaction.unitPrice ?? '',
      transaction.amount,
      transaction.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'Jyoti_Insights_Transactions.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // Close modals using Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedTransaction(null);
        setConfirmDelete(null);
        resetTransactionForm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal overlay style
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 29, 45, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 9999,
    overflowY: 'auto',
  };

  const modalStyle = {
    width: '100%',
    maxWidth: '480px',
    background: '#fff',
    borderRadius: '20px',
    padding: '26px',
    boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
    color: '#142538',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  const getInitials = (name) =>
    (name || 'Unknown Customer')
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const getStatusStyle = (status) => {
    const color = STATUS_COLORS[status] || {
      bg: '#f1f4f7',
      text: '#526579',
    };

    return {
      background: color.bg,
      color: color.text,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    };
  };

  return (
    <div className={styles.transactionsWrapper}>
      {/* Search, Filter, Add and Export */}
      <div className={styles.transactionTools}>
        <div className={styles.searchBox}>
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search customer, product or ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search transactions"
          />

          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => handleSearch('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          aria-label="Filter by transaction status"
        >
          <option value="All">All Status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Add Transaction */}
        <button
          type="button"
          onClick={() => {
            resetTransactionForm();
            setShowAddModal(true);
          }}
          style={{
            padding: '11px 16px',
            border: 'none',
            borderRadius: '10px',
            background: '#20A486',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add Transaction
        </button>

        {/* Export CSV */}
        <button
          type="button"
          onClick={exportCSV}
          style={{
            padding: '11px 16px',
            border: 'none',
            borderRadius: '10px',
            background: '#e2f3ee',
            color: '#087f70',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Transaction Table */}
      <div className={styles.tableScroll}>
        <table className={styles.transactionTable}>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {visibleTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                title="Click to view transaction details"
                style={{ cursor: 'pointer' }}
              >
                <td className={styles.transactionId}>{transaction.id}</td>

                <td>
                  <div className={styles.customerCell}>
                    <div className={styles.customerAvatar}>
                      {getInitials(transaction.customer)}
                    </div>
                    <span>{transaction.customer || 'Unknown Customer'}</span>
                  </div>
                </td>

                <td>{transaction.product || '—'}</td>

                <td className={styles.dateCell}>
                  {formatDate(transaction.date)}
                </td>

                <td className={styles.amountCell}>
                  {formatCurrency(transaction.amount)}
                </td>

                <td>
                  <span style={getStatusStyle(transaction.status)}>
                    <span
                      className={styles.statusDot}
                      style={{
                        background: 'currentColor',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                      }}
                    />
                    {transaction.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {visibleTransactions.length === 0 && (
          <div className={styles.emptyState}>
            <div>⌕</div>
            <strong>No transactions found</strong>
            <p>Try changing your search or status filter.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Showing{' '}
          {filteredTransactions.length === 0 ? 0 : startIndex + 1}
          {'–'}
          {Math.min(startIndex + perPage, filteredTransactions.length)}
          {' '}of {filteredTransactions.length} transactions
        </span>

        <div className={styles.paginationButtons}>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <button type="button" className={styles.currentPage}>
            {currentPage}
          </button>

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>

      {/* ================= ADD / EDIT TRANSACTION MODAL ================= */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetTransactionForm();
            }
          }}
          style={overlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
            style={modalStyle}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px',
              }}
            >
              <div>
                <h2
                  id="transaction-form-title"
                  style={{ margin: 0, fontSize: '22px' }}
                >
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h2>

                <p style={{ color: '#8291a4', marginTop: '6px' }}>
                  {editingTransaction
                    ? 'Update the transaction details below'
                    : 'Enter the transaction details below'}
                </p>
              </div>

              <button
                type="button"
                onClick={resetTransactionForm}
                aria-label="Close form"
                style={{
                  border: 'none',
                  background: '#f1f4f7',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  fontSize: '22px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Customer */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Customer Name</label>
                <input
                  style={inputStyle}
                  name="customer"
                  value={form.customer}
                  onChange={handleFormChange}
                  placeholder="Enter customer name"
                  maxLength={100}
                  required
                />
              </div>

              {/* Product */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Product</label>
                <select
                  style={inputStyle}
                  name="product"
                  value={form.product}
                  onChange={handleFormChange}
                  required
                >
                  {PRODUCTS.map((product) => (
  <option key={product} value={product}>
    {product}
  </option>
))}
                </select>
              </div>

              {/* Channel */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Sales Channel</label>
                <select
                  style={inputStyle}
                  name="channel"
                  value={form.channel}
                  onChange={handleFormChange}
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Quantity</label>
                <input
                  style={inputStyle}
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleFormChange}
                  min="1"
                  step="1"
                  required
                />
              </div>

              {/* Unit price */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Unit Price (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={handleFormChange}
                  placeholder="Enter price per unit"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {/* Total calculated amount */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Total Amount</label>
                <div
                  style={{
                    ...inputStyle,
                    background: '#eaf6f2',
                    fontWeight: 700,
                    color: '#168a78',
                  }}
                >
                  {formatCurrency(
                    (Number(form.quantity) || 0) *
                      (Number(form.unitPrice) || 0)
                  )}
                </div>
              </div>

              {/* Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Transaction Date</label>
                <input
                  style={inputStyle}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {/* Status */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Transaction Status</label>
                <select
                  style={inputStyle}
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {formError && (
                <p
                  role="alert"
                  style={{
                    color: '#dc4545',
                    fontSize: '13px',
                    margin: '0 0 14px',
                  }}
                >
                  {formError}
                </p>
              )}

              {/* Form Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '22px',
                }}
              >
                <button
                  type="button"
                  onClick={resetTransactionForm}
                  style={{
                    flex: 1,
                    padding: '13px',
                    border: '1px solid #dce5ea',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#526579',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '13px',
                    border: 'none',
                    borderRadius: '10px',
                    background: '#20A486',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TRANSACTION DETAILS MODAL ================= */}
      {selectedTransaction && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTransaction(null);
            }
          }}
          style={overlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            style={modalStyle}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2
                  id="transaction-detail-title"
                  style={{ margin: 0, fontSize: '22px' }}
                >
                  Transaction Details
                </h2>

                <p style={{ color: '#8291a4', marginTop: '6px' }}>
                  Complete transaction information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close details"
                style={{
                  border: 'none',
                  background: '#f1f4f7',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  fontSize: '22px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Customer */}
            <div
              style={{
                background: '#f5f8fb',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#d9eeea',
                  color: '#128477',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                {getInitials(selectedTransaction.customer)}
              </div>

              <div>
                <strong style={{ fontSize: '16px' }}>
                  {selectedTransaction.customer || 'Unknown Customer'}
                </strong>

                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#8492a5',
                    fontSize: '13px',
                  }}
                >
                  Customer
                </p>
              </div>
            </div>

            {/* Amount */}
            <div
              style={{
                background: '#eaf6f2',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <span style={{ color: '#698b83', fontSize: '13px' }}>
                Transaction Amount
              </span>

              <h2
                style={{
                  margin: '8px 0 0',
                  color: '#168a78',
                  fontSize: '30px',
                }}
              >
                {formatCurrency(selectedTransaction.amount)}
              </h2>
            </div>

            {/* Transaction Information */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                ['Transaction ID', selectedTransaction.id],
                ['Product', selectedTransaction.product || '—'],
                ['Sales Channel', selectedTransaction.channel || '—'],
                ['Quantity', selectedTransaction.quantity ?? 1],
                [
                  'Unit Price',
                  formatCurrency(
                    selectedTransaction.unitPrice ??
                      Number(selectedTransaction.amount) /
                        Math.max(
                          1,
                          Number(selectedTransaction.quantity) || 1
                        )
                  ),
                ],
                ['Transaction Date', formatDate(selectedTransaction.date)],
                ['Transaction Status', selectedTransaction.status || 'Unknown'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderBottom: '1px solid #edf0f3',
                    paddingBottom: '12px',
                  }}
                >
                  <span style={{ color: '#8090a3', fontSize: '14px' }}>
                    {label}
                  </span>

                  <strong
                    style={{
                      fontSize: '14px',
                      textAlign: 'right',
                      color:
                        label === 'Transaction Status'
                          ? (STATUS_COLORS[selectedTransaction.status]?.text ||
                            '#20344a')
                          : '#20344a',
                    }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            {/* Edit / Delete */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleEditClick}
                style={{
                  flex: 1,
                  padding: '13px',
                  background: '#e2f3ee',
                  color: '#087f70',
                  border: 'none',
                  borderRadius: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✎ Edit
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                style={{
                  flex: 1,
                  padding: '13px',
                  background: '#fff0f0',
                  color: '#c43d3d',
                  border: 'none',
                  borderRadius: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '13px',
                background: '#14283d',
                color: '#fff',
                border: 'none',
                borderRadius: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {confirmDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
          style={overlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            style={{
              ...modalStyle,
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fff0f0',
                color: '#c43d3d',
                display: 'grid',
                placeItems: 'center',
                fontSize: '24px',
                margin: '0 auto 16px',
              }}
            >
              !
            </div>

            <h2
  id="delete-transaction-title"
  style={{ margin: '0 0 10px', fontSize: '21px' }}
>
  Delete Transaction?
</h2>

            <p
              style={{
                color: '#8291a4',
                lineHeight: 1.6,
                margin: '0 0 8px',
              }}
            >
              Are you sure you want to delete{' '}
              <strong>{confirmDelete.id}</strong> for{' '}
              <strong>{confirmDelete.customer}</strong>? This action cannot be
              undone.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: '13px',
                  border: '1px solid #dce5ea',
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#526579',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '13px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#df5656',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}