import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f39c12"];

const ExpensesPage = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    fetch(`http://localhost:5000/api/transactions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter only expenses
        const expenses = data.filter((t) => t.type === "expense");
        setTransactions(expenses);
      })
      .catch((err) => console.error("Error fetching expenses:", err));
  }, []);

  // Prepare pie chart data
  const categoryMap = {};
  transactions.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + parseFloat(t.amount);
  });
  const pieData = Object.keys(categoryMap).map((c) => ({ name: c, value: categoryMap[c] }));

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", overflowY: "auto" }}>
        <h2>Expenses</h2>

        {/* Pie Chart */}
        <div style={{ height: "300px", marginBottom: "20px", background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <h3>Expenses by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <h3>Expense Transactions</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f1f1" }}>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>₹{t.amount}</td>
                  <td>{t.date}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
                    No expense transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
