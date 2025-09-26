import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useUser } from "../context/UserContext";

const BudgetPage = () => {
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

  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    const fetchData = async () => {
      try {
        const [budRes, transRes, totalRes] = await Promise.all([
          fetch(`http://localhost:5000/api/budgets/${userId}`),
          fetch(`http://localhost:5000/api/transactions/${userId}`),
          fetch(`http://localhost:5000/api/totalBudget/${userId}`),
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
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const totalSpent = budgets.reduce(
    (sum, b) => sum + calculateSpent(b.category),
    0
  );
  const overallProgress = totalBudget
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0;

  const handleAddBudget = async () => {
    if (!form.category || !form.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
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

  const handleSetTotalBudget = async () => {
    if (!totalBudgetInput) return alert("Enter total budget!");
    try {
      const res = await fetch(`http://localhost:5000/api/totalBudget/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: parseFloat(totalBudgetInput) }),
      });
      const data = await res.json();
      setTotalBudget(Number(data.totalBudget));
      setTotalBudgetInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to set total budget.");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/budgets/${userId}/${id}`, {
        method: "DELETE",
      });
      setBudgets(budgets.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete budget.");
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setEditForm({ category: budget.category, amount: budget.amount });
  };

  const handleSaveBudget = async (id) => {
    if (!editForm.category || !editForm.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`http://localhost:5000/api/budgets/${userId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editForm.category, amount: parseFloat(editForm.amount) }),
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
    <div style={{ display: "flex", minHeight: "100vh", width: "1450px" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "30px", background: "#f4f6f8" }}>
        <h2 style={{ marginBottom: "20px", color: "#236fbc" }}>Budget</h2>

        {/* Total Spending Progress */}
        {totalBudget > 0 && (
          <div style={cardStyle}>
            <h3>Total Spending Progress</h3>
            <p>Spent: ₹{totalSpent} / ₹{totalBudget}</p>
            <div style={progressOuter}>
              <div
                style={{
                  ...progressInner,
                  width: `${overallProgress}%`,
                  background: overallProgress >= 100 ? "#e74c3c" : "#2ecc71",
                }}
              />
            </div>
            <p>{overallProgress.toFixed(2)}% spent</p>
          </div>
        )}

        {/* Set Total Budget */}
        <div style={cardStyle}>
          <h3>Set Total Monthly Budget</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Enter total budget"
              value={totalBudgetInput}
              onChange={(e) => setTotalBudgetInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleSetTotalBudget} style={greenBtn}>
              Set Budget
            </button>
          </div>
        </div>

        {/* Add Budget */}
        <div style={cardStyle}>
          <h3>Add Budget</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ ...inputStyle, width: "120px" }}
            />
            <button onClick={handleAddBudget} style={blueBtn}>
              Add
            </button>
          </div>
        </div>

        {/* Budgets Table */}
        <div style={cardStyle}>
          <h3>Monthly Budgets</h3>
          {budgets.length === 0 ? (
            <p>No budgets yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f1f1" }}>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const spent = calculateSpent(b.category);
                  const progress = Math.min((spent / b.amount) * 100, 100);
                  return (
                    <tr key={b.id}>
                      {editingBudgetId === b.id ? (
                        <>
                          <td>
                            <input
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm({ ...editForm, category: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) =>
                                setEditForm({ ...editForm, amount: e.target.value })
                              }
                            />
                          </td>
                          <td>₹{spent}</td>
                          <td>
                            <div style={progressOuter}>
                              <div
                                style={{
                                  ...progressInner,
                                  width: `${progress}%`,
                                  background: progress >= 100 ? "#e74c3c" : "#3498db",
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <button onClick={() => handleSaveBudget(b.id)} style={greenBtn}>
                              Save
                            </button>
                            <button
                              onClick={() => setEditingBudgetId(null)}
                              style={blueBtn}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{b.category}</td>
                          <td>₹{b.amount}</td>
                          <td>₹{spent}</td>
                          <td>
                            <div style={progressOuter}>
                              <div
                                style={{
                                  ...progressInner,
                                  width: `${progress}%`,
                                  background: progress >= 100 ? "#e74c3c" : "#3498db",
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditBudget(b)}
                              style={{ ...blueBtn, marginRight: "5px" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(b.id)}
                              style={{ ...greenBtn, background: "#e74c3c" }}
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const inputStyle = {
  padding: "8px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  flex: 1,
  minWidth: "120px",
};

const blueBtn = {
  padding: "8px 16px",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const greenBtn = {
  padding: "8px 16px",
  background: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const progressOuter = {
  background: "#eee",
  borderRadius: "5px",
  overflow: "hidden",
  height: "15px",
};

const progressInner = {
  height: "100%",
  transition: "width 0.3s",
};

export default BudgetPage;
