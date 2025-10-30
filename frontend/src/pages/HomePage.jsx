import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const HomePage = () => {
  const { darkMode } = useTheme();
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [filter, setFilter] = useState({ month: "All", category: "All", type: "All" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ type: "", category: "", amount: "", date: "" });
  const [spendingPercent, setSpendingPercent] = useState(0);

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/transactions/${userId}`);
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
      calculateTotals(data, filter.month);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotals = (data, month) => {
    let filteredData = data;
    if (month && month !== "All") filteredData = data.filter(t => t.date.startsWith(month));
    else filteredData = data.filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7)));

    let income = 0, expenses = 0;
    filteredData.forEach(t => {
      if (t.type === "income") income += parseFloat(t.amount);
      else expenses += parseFloat(t.amount);
    });

    setTotalIncome(income);
    setTotalExpenses(expenses);
    setCurrentBalance(income - expenses);
    setSpendingPercent(income > 0 ? Math.min((expenses / income) * 100, 100) : 0);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await fetch(`/api/transactions/${userId}/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit transaction
  const handleEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      type: t.type,
      category: t.category,
      amount: t.amount,
      date: t.date.slice(0, 10)
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSave = async (id) => {
    try {
      await fetch(`/api/transactions/${userId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update transaction");
    }
  };

  // Filtering
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilter = { ...filter, [name]: value };
    setFilter(newFilter);

    let filteredData = [...transactions];
    if (newFilter.month !== "All") filteredData = filteredData.filter(t => t.date.startsWith(newFilter.month));
    if (newFilter.category !== "All") filteredData = filteredData.filter(t => t.category === newFilter.category);
    if (newFilter.type !== "All") filteredData = filteredData.filter(t => t.type === newFilter.type);

    setFiltered(filteredData);
    calculateTotals(transactions, newFilter.month);
  };

  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))];
  const categories = [...new Set(transactions.map(t => t.category))];
  const types = ["income", "expense"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Poppins, sans-serif", width: "1500px" }}>
      <Sidebar darkMode />

      <div style={{
        flex: 1,
        padding: "30px",
        background: darkMode ? "#121212" : "#f9fafb",
        color: darkMode ? "#e0e0e0" : "#333",
        overflowY: "auto",
        marginLeft: "300px"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "600", marginBottom: "5px" }}>
              Welcome back, {user?.username || "User"} 👋
            </h1>
            <p style={{ color: darkMode ? "#aaa" : "#666", marginBottom: "20px" }}>Here’s your financial snapshot.</p>
          </div>
          <button
            onClick={() => navigate("/addTransaction")}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            ➕ Add Transaction
          </button>
        </div>

        {/* Monthly Spending Progress */}
        <div style={{
          background: darkMode ? "#1f1f1f" : "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: darkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginBottom: "10px" }}>Monthly Spending Progress</h3>
          <div style={{ background: darkMode ? "#333" : "#eee", borderRadius: "10px", overflow: "hidden", height: "20px" }}>
            <div style={{
              width: `${spendingPercent}%`,
              background: spendingPercent >= 100 ? "#dc2626" : "#16a34a",
              height: "100%",
              transition: "width 0.3s",
            }} />
          </div>
          <p style={{ marginTop: "5px", fontWeight: "500", color: spendingPercent >= 100 ? "#dc2626" : "#16a34a" }}>
            {spendingPercent.toFixed(2)}% of income spent
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <SummaryCard title="Current Balance" value={`₹${currentBalance.toLocaleString()}`} color="#2563eb" darkMode={darkMode} />
          <SummaryCard title="Total Income" value={`₹${totalIncome.toLocaleString()}`} color="#16a34a" darkMode={darkMode} />
          <SummaryCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} color="#dc2626" darkMode={darkMode} />
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
          marginBottom: "20px",
          background: darkMode ? "#1f1f1f" : "#fff",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: darkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: 0 }}>Filter By:</h3>

          <select name="month" onChange={handleFilterChange} value={filter.month} style={filterSelectStyle(darkMode)}>
            <option value="All">All Months</option>
            {months.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>

          <select name="category" onChange={handleFilterChange} value={filter.category} style={filterSelectStyle(darkMode)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>

          <select name="type" onChange={handleFilterChange} value={filter.type} style={filterSelectStyle(darkMode)}>
            <option value="All">All Types</option>
            {types.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>

          <CSVLink data={filtered} filename="transactions.csv">
            <button style={{ ...filterSelectStyle(darkMode), background: "#2563eb", color: "white", marginLeft: "auto" }}>
              ⬇️ Export CSV
            </button>
          </CSVLink>
        </div>

        {/* Transactions Table */}
        <div style={{
          background: darkMode ? "#1f1f1f" : "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: darkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontWeight: "500", marginBottom: "15px" }}>Recent Transactions</h3>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: darkMode ? "#1f1f1f" : "#fff"
          }}>
            <thead>
              <tr style={{
                color: darkMode ? "#bbb" : "#555",
                textAlign: "left",
                borderBottom: `2px solid ${darkMode ? "#333" : "#ddd"}`
              }}>
                <th style={thStyle(darkMode)}>Date</th>
                <th style={thStyle(darkMode)}>Category</th>
                <th style={thStyle(darkMode)}>Type</th>
                <th style={thStyle(darkMode)}>Amount</th>
                <th style={thStyle(darkMode)}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${darkMode ? "#333" : "#eee"}` }}>
                  <td style={tdStyle(darkMode)}>
                    {editingId === t.id ? <input type="date" name="date" value={editForm.date} onChange={handleEditChange} /> : t.date}
                  </td>
                  <td style={tdStyle(darkMode)}>
                    {editingId === t.id ? <input name="category" value={editForm.category} onChange={handleEditChange} /> : t.category}
                  </td>
                  <td style={tdStyle(darkMode)}>
                    {editingId === t.id ? (
                      <select name="type" value={editForm.type} onChange={handleEditChange}>
                        <option value="income">income</option>
                        <option value="expense">expense</option>
                      </select>
                    ) : (
                      <span style={{
                        background: t.type === "income" ? "#dcfce7" : "#fee2e2",
                        color: t.type === "income" ? "#16a34a" : "#dc2626",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}>
                        {t.type}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle(darkMode), fontWeight: "600", color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {editingId === t.id ? <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} /> : `₹${parseFloat(t.amount).toLocaleString()}`}
                  </td>
                  <td style={tdStyle(darkMode)}>
                    {editingId === t.id ? (
                      <>
                        <button onClick={() => handleSave(t.id)} style={actionBtn("#16a34a")}>💾 Save</button>
                        <button onClick={() => setEditingId(null)} style={actionBtn("#dc2626")}>❌ Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(t)} style={actionBtn("#2563eb")}>✏️ Edit</button>
                        <button onClick={() => handleDelete(t.id)} style={actionBtn("#dc2626")}>🗑️ Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && <p style={{ textAlign: "center", color: darkMode ? "#888" : "#888", marginTop: "20px" }}>No transactions found</p>}
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const SummaryCard = ({ title, value, color, darkMode }) => (
  <div style={{
    flex: 1,
    color: darkMode ? "#e0e0e0" : "#333",
    background: darkMode ? "#1f1f1f" : "white",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: darkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.08)"
  }}>
    <p style={{ color: darkMode ? "#aaa" : "#555", marginBottom: "8px" }}>{title}</p>
    <p style={{ fontSize: "22px", fontWeight: "600", color }}>{value}</p>
  </div>
);

const filterSelectStyle = (darkMode) => ({
  padding: "8px 12px",
  borderRadius: "6px",
  border: `1px solid ${darkMode ? "#444" : "#ccc"}`,
  background: darkMode ? "#2c2c2c" : "white",
  color: darkMode ? "#e0e0e0" : "black",
  cursor: "pointer"
});

const thStyle = (darkMode) => ({ padding: "12px", fontWeight: "600", fontSize: "14px", color: darkMode ? "#bbb" : "#555" });
const tdStyle = (darkMode) => ({ padding: "10px", fontSize: "14px", color: darkMode ? "#e0e0e0" : "#333" });
const actionBtn = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "6px 10px",
  marginRight: "6px",
  cursor: "pointer",
  fontSize: "13px"
});

export default HomePage;
