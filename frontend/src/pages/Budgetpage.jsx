import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const BudgetPage = () => {
  const { darkMode } = useTheme();
  const { currentUserId } = useUser();
  const userId = parseInt(currentUserId);

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", amount: "" });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString("default", { month: "long" });

  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    const fetchData = async () => {
      try {
        const [budRes, transRes, totalRes] = await Promise.all([
          fetch(`/api/budgets/${userId}`),
          fetch(`/api/transactions/${userId}`),
          fetch(`/api/totalBudget/${userId}`),
        ]);

        const budgetsData = await budRes.json();
        const transactionsData = await transRes.json();
        const totalData = await totalRes.json();

        setBudgets(budgetsData);
        setTransactions(transactionsData);
        setTotalBudget(Number(totalData.totalBudget) || 0);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch budget data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (!userId || isNaN(userId)) return <div>Loading user data...</div>;
  if (loading) return <div>Loading budgets...</div>;

  const calculateSpent = (category) => {
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.category === category &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const totalSpent = budgets.reduce(
    (sum, b) => sum + calculateSpent(b.category),
    0
  );

  const overallProgress = totalBudget
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0;

  // Add budget
  const handleAddBudget = async () => {
    if (!form.category || !form.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`/api/budgets/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          amount: parseFloat(form.amount),
        }),
      });
      const data = await res.json();
      setBudgets([...budgets, data.budget]);
      setForm({ category: "", amount: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add budget.");
    }
  };

  // Set total budget
  const handleSetTotalBudget = async () => {
    if (!totalBudgetInput) return alert("Enter total budget!");
    try {
      const res = await fetch(
        `/api/totalBudget/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalBudget: parseFloat(totalBudgetInput) }),
        }
      );
      const data = await res.json();
      setTotalBudget(Number(data.totalBudget));
      setTotalBudgetInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to set total budget.");
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id) => {
    try {
      await fetch(`/api/budgets/${userId}/${id}`, {
        method: "DELETE",
      });
      setBudgets(budgets.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete budget.");
    }
  };

  // Edit budget
  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setEditForm({ category: budget.category, amount: budget.amount });
  };

  const handleSaveBudget = async (id) => {
    if (!editForm.category || !editForm.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`/api/budgets/${userId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editForm.category,
          amount: parseFloat(editForm.amount),
        }),
      });
      const data = await res.json();
      setBudgets(budgets.map((b) => (b.id === id ? data.budget : b)));
      setEditingBudgetId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save budget.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          padding: "30px",
          background: darkMode ? "#121212" : "#f9fafb",
          color: darkMode ? "#e0e0e0" : "#333",
          marginLeft: "300px",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#2f80ed", fontWeight: "700" }}>
          {monthName} Budget Dashboard
        </h2>

        {/* Overall Progress */}
        {totalBudget > 0 && (
          <div style={{ ...cardStyle(darkMode), background: darkMode ? "#1f1f1f" : "#e8f8f5" }}>
            <h3 style={{ fontWeight: "700" }}>Total Spending Progress</h3>
            <p>Spent: ₹{totalSpent} / ₹{totalBudget}</p>
            <div style={progressOuter}>
              <div
                style={{
                  ...progressInner,
                  width: `${overallProgress}%`,
                  background: overallProgress >= 100 ? "#e74c3c" : "#27ae60",
                }}
              />
            </div>
            <p>{overallProgress.toFixed(2)}% spent</p>
          </div>
        )}

        {/* Set Total Budget */}
        <div style={cardStyle(darkMode)}>
          <h3 style={sectionTitle}>Set Total Monthly Budget</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Enter total budget"
              value={totalBudgetInput}
              onChange={(e) => setTotalBudgetInput(e.target.value)}
              style={inputStyle(darkMode)}
            />
            <button onClick={handleSetTotalBudget} style={greenBtn}>
              Set Budget
            </button>
          </div>
        </div>

        {/* Add Budget */}
        <div style={cardStyle(darkMode)}>
          <h3 style={sectionTitle}>Add New Budget</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inputStyle(darkMode)}
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ ...inputStyle(darkMode), width: "150px" }}
            />
            <button onClick={handleAddBudget} style={blueBtn}>
              Add
            </button>
          </div>
        </div>

        {/* Monthly Budgets in Card Layout */}
        <div>
          <h3 style={sectionTitle}>Monthly Budgets</h3>
          {budgets.length === 0 ? (
            <p>No budgets yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
              {budgets.map((b) => {
                const spent = calculateSpent(b.category);
                const progress = Math.min((spent / b.amount) * 100, 100);
                const overBudget = spent > b.amount;

                return (
                  <div
                    key={b.id}
                    style={{
                      background: overBudget
                        ? darkMode
                          ? "#3e1f1f"
                          : "#ffe6e6"
                        : darkMode
                        ? "#1f1f1f"
                        : "#e8f8f5",
                      borderRadius: "12px",
                      padding: "15px 20px",
                      width: "300px",
                      boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {editingBudgetId === b.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm({ ...editForm, category: e.target.value })
                          }
                          style={inputStyle(darkMode)}
                        />
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) =>
                            setEditForm({ ...editForm, amount: e.target.value })
                          }
                          style={inputStyle(darkMode)}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => handleSaveBudget(b.id)} style={greenBtn}>Save</button>
                          <button onClick={() => setEditingBudgetId(null)} style={blueBtn}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ margin: "0 0 5px 0" }}>{b.category}</h4>
                        <p style={{ margin: "0 0 10px 0" }}>
                          Budget: ₹{b.amount} <br />
                          Spent: ₹{spent} <br />
                          Remaining: ₹{Math.max(b.amount - spent, 0)}
                        </p>
                        <div style={progressOuter}>
                          <div
                            style={{
                              ...progressInner,
                              width: `${progress}%`,
                              background: overBudget ? "#e74c3c" : "#27ae60",
                            }}
                          />
                        </div>
                        <p style={{ margin: "5px 0 10px 0" }}>{progress.toFixed(2)}% used</p>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => handleEditBudget(b)} style={blueBtn}>Edit</button>
                          <button onClick={() => handleDeleteBudget(b.id)} style={redBtn}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const cardStyle =(darkMode)=> ({
  background: darkMode ? "#1f1f1f" : "#fff",
  padding: "25px",
  borderRadius: "15px",
  marginBottom: "20px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  width: "100%",
});

const inputStyle = (darkMode) => ({
  background: darkMode ? "#111010ff" : "#fff",
  color: darkMode ? "#e0e0e0" : "#000",
  padding: "10px 12px",
  borderRadius: "10px",
  border: `1px solid ${darkMode ? "#555" : "#ccc"}`,
  flex: 1,
  minWidth: "120px",
  fontSize: "15px",
  outline: "none",
});

const blueBtn = {
  padding: "10px 18px",
  background: "#2f80ed",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  transition: "0.2s all",
};

const greenBtn = {
  padding: "10px 18px",
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  transition: "0.2s all",
};

const redBtn = {
  padding: "10px 18px",
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  transition: "0.2s all",
};

const progressOuter = {
  background: "#f0f0f0",
  borderRadius: "10px",
  overflow: "hidden",
  height: "16px",
  marginTop: "5px",
  border: "2px solid black",
};

const progressInner = {
  height: "100%",
  transition: "width 0.3s",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "700",
  marginBottom: "15px",
  color: "#2f80ed",
};

export default BudgetPage;
