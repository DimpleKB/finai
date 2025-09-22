import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [transactions, setTransactions] = useState([]);
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
          message: "⚠️ You have exceeded your total budget!",
        });
      } else if (spentPercent >= 80) {
        notifs.push({
          id: 2,
          type: "warning",
          message: "⚠️ You have used more than 80% of your budget.",
        });
      } else {
        notifs.push({
          id: 3,
          type: "info",
          message: `✅ You are within budget. (${spentPercent.toFixed(1)}% spent)`,
        });
      }
    }

    // Example: Large transactions notification
    transactions.forEach((t) => {
      if (t.type === "expense" && parseFloat(t.amount) > 1000) {
        notifs.push({
          id: t.id + "-large",
          type: "warning",
          message: `💸 High expense detected: ₹${t.amount} on ${t.category}`,
        });
      }
    });

    setNotifications(notifs);
  };

  useEffect(() => {
    fetchTransactions();
    fetchTotalBudget();
  }, []);

  useEffect(() => {
    generateNotifications();
  }, [transactions, totalBudget]);

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", overflowY: "auto", }}>
        <h2 style={{textAlign:"center",}}>Notifications</h2>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px" }}>
          {notifications.length === 0 ? (
            <p>No notifications 🎉</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  style={{
                    marginBottom: "10px",
                    padding: "15px",
                    borderRadius: "8px",
                    background:
                      n.type === "danger"
                        ? "#f8d7da"
                        : n.type === "warning"
                        ? "#fff3cd"
                        : "#d1ecf1",
                    color:
                      n.type === "danger"
                        ? "#721c24"
                        : n.type === "warning"
                        ? "#856404"
                        : "#0c5460",
                  }}
                >
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
