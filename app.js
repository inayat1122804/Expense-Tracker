const STORAGE_KEY = 'expenseTrackerData';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
  expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other Expense'],
};

let transactions = [];
let selectedType = 'income';

const form = document.getElementById('transaction-form');
const typeButtons = document.querySelectorAll('.type-btn');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const transactionList = document.getElementById('transaction-list');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const balanceEl = document.getElementById('balance');

function init() {
  loadFromStorage();
  dateInput.value = new Date().toISOString().split('T')[0];
  populateCategories(selectedType);
  populateFilterCategories();
  render();
  bindEvents();
}

function bindEvents() {
  typeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.type;
      typeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      populateCategories(selectedType);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTransaction();
  });

  filterType.addEventListener('change', render);
  filterCategory.addEventListener('change', render);
}

function populateCategories(type) {
  categorySelect.innerHTML = CATEGORIES[type]
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join('');
}

function populateFilterCategories() {
  const allCategories = [...new Set([...CATEGORIES.income, ...CATEGORIES.expense])];
  filterCategory.innerHTML =
    '<option value="all">All Categories</option>' +
    allCategories.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
}

function addTransaction() {
  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = categorySelect.value;
  const date = dateInput.value;

  if (!description || !amount || amount <= 0) return;

  const transaction = {
    id: Date.now().toString(),
    type: selectedType,
    description,
    amount,
    category,
    date,
  };

  transactions.unshift(transaction);
  saveToStorage();
  render();
  form.reset();
  dateInput.value = new Date().toISOString().split('T')[0];
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveToStorage();
  render();
}

function getFilteredTransactions() {
  const typeFilter = filterType.value;
  const categoryFilter = filterCategory.value;

  return transactions.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesType && matchesCategory;
  });
}

function calculateSummary() {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expenses, balance: income - expenses };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function render() {
  const { income, expenses, balance } = calculateSummary();
  totalIncomeEl.textContent = formatCurrency(income);
  totalExpensesEl.textContent = formatCurrency(expenses);
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    transactionList.innerHTML =
      '<li class="empty-state">No transactions found.</li>';
    return;
  }

  transactionList.innerHTML = filtered
    .map(
      (t) => `
    <li class="transaction-item">
      <div class="transaction-info">
        <span class="transaction-desc">${escapeHtml(t.description)}</span>
        <span class="transaction-meta">${escapeHtml(t.category)} &middot; ${formatDate(t.date)}</span>
      </div>
      <div class="transaction-right">
        <span class="transaction-amount ${t.type}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </span>
        <button class="btn-delete" data-id="${t.id}" aria-label="Delete transaction">
          <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
        </button>
      </div>
    </li>`
    )
    .join('');

  transactionList.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      transactions = JSON.parse(data);
    } catch {
      transactions = [];
    }
  }
}

init();
