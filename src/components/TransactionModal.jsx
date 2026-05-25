import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './TransactionModal.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ tx, onSave, onClose, INCOME_CATEGORIES, EXPENSE_CATEGORIES }) {
  const [type,        setType]        = useState(tx?.type        ?? 'expense');
  const [amount,      setAmount]      = useState(tx?.amount      ?? '');
  const [category,    setCategory]    = useState(tx?.category    ?? '');
  const [description, setDescription] = useState(tx?.description ?? '');
  const [date,        setDate]        = useState(tx?.date        ?? today());
  const [error,       setError]       = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset category when type changes
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory('');
  }, [type]); // eslint-disable-line

  function handleSubmit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount.');
    if (!category)                       return setError('Select a category.');
    if (!description.trim())             return setError('Add a description.');
    if (!date)                           return setError('Pick a date.');
    setError('');
    onSave({ type, amount: Number(amount), category, description: description.trim(), date });
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={tx ? 'Edit transaction' : 'Add transaction'}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{tx ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Type toggle */}
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'expense' ? styles.typeBtnExpense : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowDownRight size={15} /> Expense
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${type === 'income' ? styles.typeBtnIncome : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowUpRight size={15} /> Income
            </button>
          </div>

          {/* Amount */}
          <div className={styles.field}>
            <label className={styles.label}>Amount</label>
            <div className={styles.inputWrap}>
              <DollarSign size={15} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <div className={styles.inputWrap}>
              <Tag size={15} className={styles.inputIcon} />
              <select
                className={`${styles.input} ${styles.select}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <div className={styles.inputWrap}>
              <FileText size={15} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          {/* Date */}
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <div className={styles.inputWrap}>
              <Calendar size={15} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`${styles.saveBtn} ${type === 'income' ? styles.saveBtnGreen : styles.saveBtnRed}`}
            >
              {tx ? 'Save changes' : `Add ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
