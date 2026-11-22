
import React from 'react';
import styles from '../styles/Dashboard.module.css';

export default function SalesStatCard({
  label,
  value,
  note,
  icon,
  variant
}) {
  return (
    <article className={`${styles.statCard} ${styles[variant]}`}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statIcon}>{icon}</div>
      </div>

      <h2 className={styles.statValue}>{value}</h2>
      <p className={styles.statNote}>{note}</p>
    </article>
  );
}
