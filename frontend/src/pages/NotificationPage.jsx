import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

// Notification Card Component
const NotificationCard = ({ notification, darkMode }) => {
  const bgColor =
    notification.type === "danger"
      ? "#f8d7da"
      : notification.type === "warning"
      ? "#fff3cd"
      : "#d1ecf1";

  const textColor =
    notification.type === "danger"
      ? "#721c24"
      : notification.type === "warning"
      ? "#856404"
      : "#0c5460";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: bgColor,
        color: textColor,
        padding: "15px 20px",
        borderRadius: "12px",
        boxShadow: darkMode ? "0 2px 6px rgba(255,255,255,0.08)" : "0 2px 6px rgba(0,0,0,0.08)",
        transition: "transform 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "20px" }}>{notification.icon}</span>
        <div>
          <p style={{ margin: 0, fontWeight: "500" }}>{notification.message}</p>
          {notification.date && (
            <small style={{ color: darkMode ? "#ccc" : "#374151" }}>
              {new Date(notification.date).toLocaleDateString()}
            </small>
          )}
          {notification.category && (
            <small style={{ marginLeft: "10px", fontStyle: "italic" }}>{notification.category}</small>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationPage = () => {
  const { darkMode } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const userId = localStorage.getItem("userId");

  // Fetch transactions
  const fetchTransactions = async () => {
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
    try {
      const res = await fetch(`http://localhost:5000/api/totalBudget/${userId}`);
      const data = await res.json();
      setTotalBudget(data.totalBudget || 0);
    } catch (err) {
      console.error("Error fetching total budget:", err);
    }
  };

  // Generate notifications dynamically
  const generateNotifications = () => {
    const notifs = [];

    const totalSpent = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (totalBudget > 0) {
      const spentPercent = (totalSpent / totalBudget) * 100;
      if (spentPercent >= 100) {
        notifs.push({
          id: 1,
          type: "danger",
          icon: <FaExclamationTriangle />,
          message: "You have exceeded your total budget!",
        });
      } else if (spentPercent >= 80) {
        notifs.push({
          id: 2,
          type: "warning",
          icon: <FaExclamationTriangle />,
          message: "You have used more than 80% of your budget.",
        });
      } else {
        notifs.push({
          id: 3,
          type: "info",
          icon: <FaCheckCircle />,
          message: `You are within budget. (${spentPercent.toFixed(1)}% spent)`,
        });
      }
    }

    // Large transactions notifications
    transactions.forEach((t) => {
      if (t.type === "expense" && parseFloat(t.amount) > 1000) {
        notifs.push({
          id: t.id + "-large",
          type: "warning",
          icon: <FaMoneyBillWave />,
          message: `High expense: ₹${t.amount} on ${t.category}`,
          date: t.date,
          category: t.category,
        });
      }
    });

    setNotifications(notifs);
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchTransactions();
      await fetchTotalBudget();
    };
    fetchData();
  }, []);

  // Regenerate notifications when transactions or budget change
  useEffect(() => {
    generateNotifications();
  }, [transactions, totalBudget]);

  const filteredNotifications =
    filterType === "All" ? notifications : notifications.filter((n) => n.type === filterType);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          padding: "30px",
          background: darkMode ? "#121212" : "#f9fafb",
          color: darkMode ? "#e0e0e0" : "#333",
          width: "1100px",
          marginLeft: "300px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: darkMode ? "#e0e0e0" : "#1f2937" }}>
          Notifications
        </h2>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "20px" }}>
          {["All", "info", "warning", "danger"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: filterType === type ? "2px solid #2563eb" : "1px solid #ccc",
                background: filterType === type ? "#2563eb" : "#fff",
                color: filterType === type ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>No notifications 🎉</p>
          ) : (
            filteredNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} darkMode={darkMode} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
