import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const IncomePage = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    fetch(`http://localhost:5000/api/transactions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter only income
        const incomes = data.filter((t) => t.type === "income");
        setTransactions(incomes);
      })
      .catch((err) => console.error("Error fetching income:", err));
  }, []);

  // Prepare bar chart data
  const categoryMap = {};
  transactions.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + parseFloat(t.amount);
  });
  const barData = Object.keys(categoryMap).map((c) => ({ category: c, amount: categoryMap[c] }));

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", overflowY: "auto" }}>
        <h2>Income</h2>

        {/* Bar Chart */}
        <div style={{ height: "300px", marginBottom: "20px", background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <h3>Income by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
          <h3>Income Transactions</h3>
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
                  <td >{t.date}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
                    No income transactions found.
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

export default IncomePage;
