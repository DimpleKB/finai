import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CSVLink } from "react-csv";

const HomePage = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ description: "", category: "", amount: "", date: "", type: "expense" });
  const userId = localStorage.getItem("userId");

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${userId}`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  // Fetch total budget
  const fetchTotalBudget = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/totalBudget/${userId}`);
      const data = await res.json();
      setTotalBudget(data.totalBudget || 0);
    } catch (err) {
      console.error("Error fetching total budget:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchTotalBudget();
  }, []);

  // Line chart data
  const monthMap = {};
  transactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + parseFloat(t.amount);
  });
  const lineData = Object.keys(monthMap).map((month) => ({ month, amount: monthMap[month] }));
  lineData.sort((a, b) => (a.month > b.month ? 1 : -1));
  const monthlySpent = lineData.length ? lineData[lineData.length - 1].amount : 0;

  // Total spent calculation
  const totalSpent = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const overallProgress = totalBudget ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/transactions/${userId}/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Start editing
  const handleEdit = (t) => {
    setEditing(t.id);
    setForm({ description: t.description, category: t.category, amount: t.amount, date: t.date, type: t.type });
  };

  // Save edited transaction
  const handleSave = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${userId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditing(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update transaction");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", overflowY: "auto" }}>
        <h2>Home</h2>

        {/* Line Chart */}
        <div style={{ height: "300px", marginBottom: "20px", background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <h3>Monthly Expenses</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#e74c3c" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Total Budget Progress */}
        {totalBudget > 0 && (
          <div style={{ padding: "20px", background: "#fff", borderRadius: "10px", marginBottom: "20px" }}>
            <h3>Total Budget Progress</h3>
            <p>Spent: ₹{totalSpent} / ₹{totalBudget}</p>
            <div style={{ background: "#eee", borderRadius: "5px", overflow: "hidden", height: "15px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${overallProgress}%`,
                  background: overallProgress >= 100 ? "#e74c3c" : "#2ecc71",
                  transition: "width 0.3s",
                }}
              ></div>
            </div>
          </div>
        )}


        {/* Transactions Table */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
            <h2 style={{marginRight:"800px",}}>Transaction</h2>
            <CSVLink data={transactions} filename="transactions.csv">
              <button style={{ background: "#2677c8ff", color: "#fff", padding: "8px 12px", border: "none", borderRadius: "5px" }}>
                Download CSV
              </button>
            </CSVLink>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f1f1" }}>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  {editing === t.id ? (
                    <>
                      <td><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></td>
                      <td><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></td>
                      <td><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></td>
                      <td><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></td>
                      <td>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </td>
                      <td>
                        <button onClick={() => handleSave(t.id)}>Save</button>
                        <button onClick={() => setEditing(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{t.description}</td>
                      <td>{t.category}</td>
                      <td>₹{t.amount}</td>
                      <td>{t.date}</td>
                      <td>{t.type}</td>
                      <td>
                        <button onClick={() => handleEdit(t)} style={{ marginRight: "5px",backgroundColor:"#2677c8ff",marginLeft:"150px" }}>Edit</button>
                        <button onClick={() => handleDelete(t.id)} style={{ marginRight: "5px",backgroundColor:"#dd3607ff" }}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
