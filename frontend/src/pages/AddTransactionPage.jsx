import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

const AddTransactionPage = () => {
  const userId = localStorage.getItem("userId");
  const [form, setForm] = useState({
    type: "expense",
    description: "",
    category: "",
    amount: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async () => {
    const { type, description, category, amount, date } = form;

    if (!type || !description || !category || !amount || !date) {
      return alert("❌ All fields are required!");
    }

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description, category, amount: parseFloat(amount), date }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Transaction added successfully!");
      setForm({ type: "expense", description: "", category: "", amount: "", date: "" });
    } catch (err) {
      alert("❌ Failed to add transaction: " + err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100%", width: "100vw" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "40px", background: "#f0f2f5", overflowY: "auto" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            borderTop: "4px solid #3498db",
          }}
        >
          <h2 style={{ marginBottom: "30px", color: "#2c3e50", textAlign: "center" }}>
            Add Transaction
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label style={labelStyle}>Type</label>
            <select name="type" value={form.type} onChange={handleChange} style={selectStyle}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <label style={labelStyle}>Description</label>
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>Category</label>
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              style={inputStyle}
            />

            <label style={labelStyle}>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={inputStyle}
            />

            <button onClick={handleAddTransaction} style={saveBtn}>
              ➕ Add Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Styles =====
const labelStyle = {
  fontWeight: "600",
  marginBottom: "5px",
  color: "#34495e",
};

const inputStyle = {
  padding: "12px 15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  background:"white",
  color:"black",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
  background: "white url('data:image/svg+xml;utf8,<svg fill=\"%233498db\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>') no-repeat right 10px center",
  backgroundSize: "16px",
  color:"black",
};

const saveBtn = {
  background: "#3498db",
  color: "#fff",
  padding: "14px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "600",
  transition: "0.3s",
};

export default AddTransactionPage;
