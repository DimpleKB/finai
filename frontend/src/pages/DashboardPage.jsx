import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, AreaChart, Area
} from "recharts";

const DashboardPage = () => {
  const { darkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [healthScore, setHealthScore] = useState(0);

  const [lineData, setLineData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [stackedData, setStackedData] = useState([]);
  const [wealthData, setWealthData] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [forecastData, setForecastData] = useState([]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#3399FF"];

  // Fetch transactions on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("⚠️ Please login first");
      window.location.href = "/login";
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transactions/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(data);
        processTransactions(data);
      } catch (err) {
        console.error(err);
        alert("❌ Error loading transactions");
      }
    };

    fetchTransactions();
  }, []);

  // Process transactions to generate chart data and totals
  const processTransactions = (data) => {
    calculateTotals(data);
    prepareCharts(data);
  };

  const calculateTotals = (data) => {
    let income = 0, expense = 0;
    data.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === "income") income += amt;
      else expense += amt;
    });
    const balance = income - expense;
    setTotals({ income, expense, balance });
    const ratio = income > 0 ? ((income - expense) / income) * 100 : 0;
    setHealthScore(Math.min(Math.max(ratio, 0), 100));
  };

  const prepareCharts = (data) => {
    // Monthly income & expense
    const monthlyMap = {};
    data.forEach(t => {
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expense: 0 };
      const amt = parseFloat(t.amount);
      if (t.type === "income") monthlyMap[month].income += amt;
      else monthlyMap[month].expense += amt;
    });
    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    setLineData(monthlyData);

    // Bar chart: savings
    const bar = monthlyData.map(m => ({ month: m.month, savings: m.income - m.expense }));
    setBarData(bar);

    // Stacked income vs expense
    setStackedData(monthlyData.map(m => ({ month: m.month, income: m.income, expense: m.expense })));

    // Wealth growth
    let cumulative = 0;
    const wealth = monthlyData.map(m => {
      cumulative += m.income - m.expense;
      return { month: m.month, balance: cumulative };
    });
    setWealthData(wealth);

    // Category pie chart
    const categoryTotals = {};
    data.forEach(t => {
      if (t.type === "expense") {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
      }
    });
    const pie = Object.keys(categoryTotals).map(cat => ({ name: cat, value: categoryTotals[cat] }));
    setPieData(pie);
    setTopCategories(pie.sort((a, b) => b.value - a.value).slice(0, 5));

    // AI Forecast: simple trend projection
    const forecast = [...bar];
    if (bar.length >= 2) {
      const last = bar[bar.length - 1].savings;
      const prev = bar[bar.length - 2].savings;
      const projected = last + (last - prev) * 0.5;
      forecast.push({ month: "Next", savings: projected, predicted: projected });
    }
    setForecastData(forecast.map((d, i) => ({ ...d, predicted: i === forecast.length - 1 ? d.savings : null })));
  };

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />
      <div style={{
        flex: 1,
        padding: "20px",
        marginLeft: "300px",
        background: darkMode ? "#121212" : "#f9fafb",
        color: darkMode ? "#e0e0e0" : "#333",
        overflowY: "auto"
      }}>
        <h2>Dashboard Overview</h2>
        <p style={{ color: "#555" }}>AI-powered insights into your income, expenses, and savings patterns.</p>

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: "20px", marginTop: "20px", marginBottom: "20px" }}>
          <SummaryCard title="Total Income" value={`₹${totals.income.toLocaleString()}`} color="#00C49F" />
          <SummaryCard title="Total Expenses" value={`₹${totals.expense.toLocaleString()}`} color="#FF8042" />
          <SummaryCard title="Net Balance" value={`₹${totals.balance.toLocaleString()}`} color={totals.balance >= 0 ? "#0088FE" : "#FF4C4C"} />
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <ChartCard title="Income vs Expense Trend" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
                <XAxis dataKey="month" stroke={darkMode ? "#e0e0e0" : "#333"} />
                <YAxis stroke={darkMode ? "#e0e0e0" : "#333"} />
                <Tooltip />
                <Legend />
                <Line dataKey="income" stroke="#00C49F" strokeWidth={2} />
                <Line dataKey="expense" stroke="#FF8042" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Expenses by Category" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Net Savings" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
                <XAxis dataKey="month" stroke={darkMode ? "#e0e0e0" : "#333"} />
                <YAxis stroke={darkMode ? "#e0e0e0" : "#333"} />
                <Tooltip />
                <Bar dataKey="savings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Financial Health Index" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                barSize={20}
                data={[{ name: "Health", value: healthScore, fill: healthScore > 70 ? "#00C49F" : healthScore > 40 ? "#FFBB28" : "#FF4C4C" }]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar minAngle={15} clockWise dataKey="value" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Income vs Expense Ratio" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackedData} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
                <XAxis dataKey="month" stroke={darkMode ? "#e0e0e0" : "#333"} />
                <YAxis stroke={darkMode ? "#e0e0e0" : "#333"} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" stackId="a" fill="#00C49F" />
                <Bar dataKey="expense" stackId="a" fill="#FF7043" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Cumulative Wealth Growth" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={wealthData}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={darkMode ? "#e0e0e0" : "#333"} />
                <YAxis stroke={darkMode ? "#e0e0e0" : "#333"} />
                <Tooltip />
                <Area type="monotone" dataKey="balance" stroke="#42A5F5" fill="url(#colorWealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 5 Spending Categories" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topCategories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5}>
                  {topCategories.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="AI-Powered Savings Forecast" darkMode={darkMode}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
                <XAxis dataKey="month" stroke={darkMode ? "#e0e0e0" : "#333"} />
                <YAxis stroke={darkMode ? "#e0e0e0" : "#333"} />
                <Tooltip />
                <Line type="monotone" dataKey="savings" stroke="#8884d8" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="predicted" stroke="#FF0000" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const SummaryCard = ({ title, value, color }) => (
  <div style={{
    flex: 1, background: "#fff", padding: "15px 20px",
    borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  }}>
    <h4 style={{ color: "#555", marginBottom: "5px" }}>{title}</h4>
    <h2 style={{ color, margin: 0 }}>{value}</h2>
  </div>
);

const ChartCard = ({ title, children, darkMode }) => (
  <div style={{
    background: darkMode ? "#1E1E1E" : "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  }}>
    <h3 style={{ marginBottom: "10px", color: darkMode ? "#e0e0e0" : "#333" }}>{title}</h3>
    {children}
  </div>
);

export default DashboardPage;
