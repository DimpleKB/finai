import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import Sidebar from "../components/Sidebar";

function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("⚠️ Please login first");
      window.location.href = "/login";
      return;
    }

    // ✅ Fetch transactions from backend
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transactions/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");

        const data = await res.json();
        setTransactions(data);
        prepareCharts(data);
      } catch (err) {
        console.error(err);
        alert("❌ Error loading transactions");
      }
    };

    fetchTransactions();
  }, []);

  const prepareCharts = (data) => {
    // 📊 Line Chart: Monthly Expenses
    const monthly = {};
    data.forEach((t) => {
      const month = t.date.slice(0, 7); // yyyy-mm
      monthly[month] = (monthly[month] || 0) + parseFloat(t.amount);
    });

    const line = Object.keys(monthly)
      .sort()
      .map((month) => ({ month, amount: monthly[month] }));
    setLineData(line);

    // 🥧 Pie Chart: Category-wise Expenses
    const category = {};
    data.forEach((t) => {
      category[t.category] = (category[t.category] || 0) + parseFloat(t.amount);
    });

    const pie = Object.keys(category).map((cat) => ({
      name: cat,
      value: category[cat],
    }));
    setPieData(pie);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#3399FF"];

  return (
    <div style={{ display: "flex", height: "100%", width: "100vw", overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Dashboard</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "20px", marginTop: "20px" }}>
          {/* Line Chart */}
          <div style={{ flex: 1, background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <h3>Monthly Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ flex: 1, background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <h3>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
