import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const BudgetPage = () => {
  const userId = localStorage.getItem("userId");

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editForm, setEditForm] = useState({ category: "", amount: "" });

  // Fetch budgets, transactions, total budget
  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5000/api/transactions/${userId}`)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error(err));

    fetch(`http://localhost:5000/api/budgets/${userId}`)
      .then(res => res.json())
      .then(data => setBudgets(data))
      .catch(err => console.error(err));

    fetch(`http://localhost:5000/api/totalBudget/${userId}`)
      .then(res => res.json())
      .then(data => setTotalBudget(Number(data.totalBudget) || 0))
      .catch(err => console.error(err));
  }, [userId]);

  // Calculate total spent & overall progress
  useEffect(() => {
    const spentMap = {};
    transactions.forEach(t => {
      if (t.type === "expense") {
        spentMap[t.category] = (spentMap[t.category] || 0) + parseFloat(t.amount);
      }
    });

    const spent = budgets.reduce((sum, b) => sum + (spentMap[b.category] || 0), 0);
    setTotalSpent(spent);

    const progress = totalBudget ? Math.min((spent / totalBudget) * 100, 100) : 0;
    setOverallProgress(progress);
  }, [budgets, transactions, totalBudget]);

  // Add new budget category
  const handleAddBudget = async () => {
    if (!form.category || !form.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: form.category, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      setBudgets([...budgets, data.budget]);
      setForm({ category: "", amount: "" });
    } catch (err) {
      console.error(err);
    }
  };

  // Set total budget
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
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/budgets/${userId}/${id}`, { method: "DELETE" });
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Edit budget
  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setEditForm({ category: budget.category, amount: budget.amount });
  };

  // Save edited budget
  const handleSaveBudget = async (id) => {
    if (!editForm.category || !editForm.amount) return alert("All fields are required!");
    try {
      const res = await fetch(`http://localhost:5000/api/budgets/${userId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editForm.category, amount: parseFloat(editForm.amount) }),
      });
      const data = await res.json();
      setBudgets(budgets.map(b => b.id === id ? data.budget : b));
      setEditingBudgetId(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px", background: "#ecf0f1", overflowY: "auto" }}>
        <h2>Budget</h2>

        {/* Total Monthly Budget */}
        <div style={cardStyle}>
          <h3>Set Total Monthly Budget</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="number"
              placeholder="Enter total budget"
              value={totalBudgetInput}
              onChange={(e) => setTotalBudgetInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleSetTotalBudget} style={greenBtn}>Set Budget</button>
          </div>
          {totalBudget > 0 && <p>Current Total Budget: <strong>₹{totalBudget}</strong></p>}
        </div>

        {/* Total Budget Progress */}
        {totalBudget > 0 && (
          <div style={cardStyle}>
            <h3>Total Budget Progress</h3>
            <p>Spent: ₹{totalSpent} / ₹{totalBudget}</p>
            <div style={progressOuter}>
              <div
                style={{
                  ...progressInner,
                  width: `${overallProgress}%`,
                  background: overallProgress >= 100 ? "#e74c3c" : "#2ecc71",
                }}
              ></div>
            </div>
            <p>{overallProgress.toFixed(2)}% spent</p>
          </div>
        )}

        {/* Add Budget */}
        <div style={cardStyle}>
          <h3>Add Budget</h3>
          <div style={{ display: "flex", gap: "10px" }}>
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
            <button onClick={handleAddBudget} style={blueBtn}>Add</button>
          </div>
        </div>

        {/* Budgets Table */}
        <div style={cardStyle}>
          <h3>Monthly Budgets</h3>
          {budgets.length === 0 ? <p>No budgets yet.</p> :
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f1f1" }}>
                  <th>Category</th><th>Budget</th><th>Spent</th><th>Progress</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const spent = transactions
                    .filter(t => t.type === "expense" && t.category === b.category)
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                  const progress = Math.min((spent / b.amount) * 100, 100);

                  return (
                    <tr key={b.id}>
                      {editingBudgetId === b.id ? (
                        <>
                          <td><input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></td>
                          <td><input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></td>
                          <td>₹{spent}</td>
                          <td>
                            <div style={progressOuter}>
                              <div style={{ ...progressInner, width: `${progress}%`, background: progress >= 100 ? "#e74c3c" : "#3498db" }}></div>
                            </div>
                          </td>
                          <td>
                            <button onClick={() => handleSaveBudget(b.id)} style={greenBtn}>Save</button>
                            <button onClick={() => setEditingBudgetId(null)} style={blueBtn}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{paddingLeft:"50px"}}>{b.category}</td>
                          <td style={{paddingLeft:"50px"}}>₹{b.amount}</td>
                          <td style={{paddingLeft:"50px"}}>₹{spent}</td>
                          <td >
                            <div style={progressOuter}>
                              <div style={{ ...progressInner, width: `${progress}%`, background: progress >= 100 ? "#e74c3c" : "#3498db" }}></div>
                            </div>
                          </td>
                          <td style={{paddingLeft:"150px"}}>
                            <button onClick={() => handleEditBudget(b)} style={{ ...blueBtn, marginRight: "5px" }}>Edit</button>
                            <button onClick={() => handleDeleteBudget(b.id)} style={{ ...greenBtn, background: "#e74c3c" }}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const cardStyle = { background: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "20px" };
const inputStyle = { padding: "8px", borderRadius: "5px", border: "1px solid #ccc", flex: 1 ,background:"#fff",color:"black"};
const blueBtn = { padding: "8px 16px", background: "#3498db", color: "#fff", border: "none", borderRadius: "5px" };
const greenBtn = { padding: "8px 16px", background: "#3498db", color: "#fff", border: "none", borderRadius: "5px" };
const progressOuter = { background: "#eee", borderRadius: "5px", overflow: "hidden", height: "15px" };
const progressInner = { height: "100%", transition: "width 0.3s" };

export default BudgetPage;
