let state = {
    totalSalary: 0,
    expenses: [], 
    displayCurrency: 'INR', 
    usdExchangeRate: 0.012 
};

let dynamicChartInstance = null;

const salaryForm = document.getElementById('salaryForm');
const salaryInput = document.getElementById('salaryInput');
const expenseForm = document.getElementById('expenseForm');
const expenseNameInput = document.getElementById('expenseNameInput');
const expenseAmountInput = document.getElementById('expenseAmountInput');

const displaySalary = document.getElementById('displaySalary');
const displayExpenses = document.getElementById('displayExpenses');
const displayBalance = document.getElementById('displayBalance');
const balanceCard = document.getElementById('balanceCard');

const ledgerItemsContainer = document.getElementById('ledgerItemsContainer');
const emptyLedgerFallback = document.getElementById('emptyLedgerFallback');
const globalErrorState = document.getElementById('globalErrorState');
const thresholdAlertBanner = document.getElementById('thresholdAlertBanner');

const currencyToggleBtn = document.getElementById('currencyToggleBtn');
const salarySymbol = document.getElementById('salarySymbol');
const expenseSymbol = document.getElementById('expenseSymbol');

document.addEventListener('DOMContentLoaded', () => {
    fetchExchangeRate();
    loadPersistedData();
    synchronizeDOM();
});

function saveStateToStorage() {
    localStorage.setItem('cash_flow_state', JSON.stringify({
        totalSalary: state.totalSalary,
        expenses: state.expenses
    }));
}

function loadPersistedData() {
    const rawData = localStorage.getItem('cash_flow_state');
    if (rawData) {
        try {
            const parsedData = JSON.parse(rawData);
            state.totalSalary = Number(parsedData.totalSalary) || 0;
            state.expenses = Array.isArray(parsedData.expenses) ? parsedData.expenses : [];
        } catch (e) {
            renderErrorMessage("Error processing local environment state file.");
        }
    }
}

async function fetchExchangeRate() {
    try {
        const response = await fetch('https://api.frankfurter.app/latest?from=INR&to=USD');
        if (response.ok) {
            const payload = await response.json();
            if (payload.rates && payload.rates.USD) {
                state.usdExchangeRate = payload.rates.USD;
            }
        }
    } catch (error) {
        console.warn("Currency API unreachable. Using local fallback.", error);
    }
}

function formatCurrencyValue(amountInINR) {
    if (state.displayCurrency === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInINR * state.usdExchangeRate);
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amountInINR);
}

function synchronizeDOM() {
    clearErrorState();

    const currentSalary = state.totalSalary;
    const computedTotalDebits = state.expenses.reduce((acc, item) => acc + item.amount, 0);
    const netRemainingPosition = currentSalary - computedTotalDebits;

    displaySalary.textContent = formatCurrencyValue(currentSalary);
    displayExpenses.textContent = formatCurrencyValue(computedTotalDebits);
    displayBalance.textContent = formatCurrencyValue(netRemainingPosition);

    ledgerItemsContainer.innerHTML = '';
    if (state.expenses.length === 0) {
        emptyLedgerFallback.classList.remove('hidden');
    } else {
        emptyLedgerFallback.classList.add('hidden');
        state.expenses.forEach((item) => {
            const tableRow = document.createElement('tr');
            tableRow.className = "hover:bg-gray-50 border-b border-gray-100 transition-colors";
            tableRow.innerHTML = `
                <td class="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">${escapeHtml(item.label)}</td>
                <td class="px-4 py-3 text-right font-semibold text-gray-700">${formatCurrencyValue(item.amount)}</td>
                <td class="px-4 py-3 text-center">
                    <button class="text-gray-400 hover:text-red-500 transition-colors p-1" onclick="executeDeleteRecord(${item.id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            ledgerItemsContainer.appendChild(tableRow);
        });
    }

    if (currentSalary > 0 && netRemainingPosition < (currentSalary * 0.10)) {
        thresholdAlertBanner.classList.remove('hidden');
        balanceCard.className = "bg-red-50 p-5 rounded-xl border border-red-200 text-red-900";
        displayBalance.className = "text-xl font-bold text-red-600 mt-1";
    } else {
        thresholdAlertBanner.classList.add('hidden');
        balanceCard.className = "bg-white p-5 rounded-xl border border-gray-200";
        displayBalance.className = "text-xl font-bold text-gray-900 mt-1";
    }

    renderVisualChart(netRemainingPosition, computedTotalDebits);
}

function renderVisualChart(remainingBalance, totalDebits) {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;

    if (dynamicChartInstance) {
        dynamicChartInstance.destroy();
    }

    const balancedMetric = remainingBalance < 0 ? 0 : remainingBalance;
    const dataset = (balancedMetric === 0 && totalDebits === 0) ? [1, 0] : [balancedMetric, totalDebits];
    const labels = (balancedMetric === 0 && totalDebits === 0) ? ['No Data Found', ''] : ['Net Position', 'Debits Ledger'];

    dynamicChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataset,
                backgroundColor: ['#4F46E5', '#EF4444'],
                borderWidth: 1,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (balancedMetric === 0 && totalDebits === 0) return ' No configuration configured.';
                            return ` ${context.label}: ${formatCurrencyValue(context.raw)}`;
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

salaryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrorState();
    
    const value = parseFloat(salaryInput.value);
    if (isNaN(value) || value <= 0) {
        renderErrorMessage("Salary must be numbers higher than zero.");
        return;
    }

    state.totalSalary = value;
    saveStateToStorage();
    synchronizeDOM();
    salaryInput.value = '';
});

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrorState();

    const label = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);

    if (!label) {
        renderErrorMessage("Expense item must contain an identifying text label.");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        renderErrorMessage("Amount values must be above zero.");
        return;
    }

    const currentTotalDebits = state.expenses.reduce((acc, val) => acc + val.amount, 0);
    if (currentTotalDebits + amount > state.totalSalary) {
        renderErrorMessage("System alert: Expense exceeds total available salary.");
        return;
    }

    state.expenses.push({ id: Date.now(), label, amount });
    saveStateToStorage();
    synchronizeDOM();

    expenseNameInput.value = '';
    expenseAmountInput.value = '';
});

window.executeDeleteRecord = function(id) {
    state.expenses = state.expenses.filter(item => item.id !== id);
    saveStateToStorage();
    synchronizeDOM();
};

currencyToggleBtn.addEventListener('click', () => {
    if (state.displayCurrency === 'INR') {
        state.displayCurrency = 'USD';
        currencyToggleBtn.textContent = 'Switch to INR';
        salarySymbol.textContent = '$';
        expenseSymbol.textContent = '$';
    } else {
        state.displayCurrency = 'INR';
        currencyToggleBtn.textContent = 'Switch to USD';
        salarySymbol.textContent = '₹';
        expenseSymbol.textContent = '₹';
    }
    synchronizeDOM();
});

function renderErrorMessage(text) {
    globalErrorState.textContent = text;
    globalErrorState.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearErrorState() {
    globalErrorState.textContent = '';
    globalErrorState.classList.add('hidden');
}

function escapeHtml(str) {
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}