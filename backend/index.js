import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pkg from "pg";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "client/build")));

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ----------------- Multer for Profile Pictures -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ===============================================================
// 🔹 AUTH ROUTES
// ===============================================================
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username,email,password) VALUES ($1,$2,$3) RETURNING id",
      [username, email, hashed]
    );
    res.json({ message: "✅ User registered", userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ message: "⚠️ Email already exists" });
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (!result.rows.length)
      return res.status(401).json({ message: "⚠️ User not found" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ message: "⚠️ Incorrect password" });

    res.json({
      message: "✅ Login successful",
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});


// ===============================================================
// 🔹 USER ROUTES
// ===============================================================
app.get("/api/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, username, email, profile_pic FROM users WHERE id=$1",
      [userId]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update User Profile
app.put("/api/user/:userId", upload.single("profilePic"), async (req, res) => {
  const { userId } = req.params;
  const { username, email, password } = req.body;

  try {
    console.log("Incoming data:", req.body);
    console.log("Uploaded file:", req.file);

    const updates = [];
    const values = [];

    // Username
    if (username && username.trim() !== "") {
      values.push(username.trim());
      updates.push(`username=$${values.length}`);
    }

    // Email
    if (email && email.trim() !== "") {
      values.push(email.trim());
      updates.push(`email=$${values.length}`);
    }

    // Password
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password.trim(), 10);
      values.push(hashed);
      updates.push(`password=$${values.length}`);
    }

    // Profile picture
    if (req.file) {
      values.push(req.file.filename);
      updates.push(`profile_pic=$${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Add updated_at timestamp
    updates.push(`updated_at=NOW()`);

    // Add userId as last value for WHERE clause
    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id=$${values.length} RETURNING id, username, email, profile_pic`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "✅ Profile updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Update User Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===============================================================
// 🔹 TRANSACTIONS ROUTES
// ===============================================================
// ===============================================================
// 🔹 TRANSACTIONS ROUTES (no description field)
// ===============================================================
app.post("/api/transactions/:userId", async (req, res) => {
  const { userId } = req.params;
  const { type, category, amount, date } = req.body;

  // ✅ Validation
  if (!type || !category || !amount || !date)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, category, amount, date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type, category, amount, date]
    );

    res.json({ message: "✅ Transaction added", transaction: result.rows[0] });
  } catch (err) {
    console.error("❌ Transaction Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===============================================================
// 🔹 GET all transactions
// ===============================================================
app.get("/api/transactions/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id=$1 ORDER BY date DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Transactions Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================================================
// 🔹 UPDATE a transaction
// ===============================================================
app.put("/api/transactions/:userId/:id", async (req, res) => {
  const { userId, id } = req.params;
  const { category, amount, date, type } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions 
       SET category=$1, amount=$2, date=$3, type=$4
       WHERE user_id=$5 AND id=$6 
       RETURNING *`,
      [category, amount, date, type, userId, id]
    );

    res.json({ message: "✅ Transaction updated", transaction: result.rows[0] });
  } catch (err) {
    console.error("❌ Update Transaction Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================================================
// 🔹 DELETE a transaction
// ===============================================================
app.delete("/api/transactions/:userId/:id", async (req, res) => {
  const { userId, id } = req.params;
  try {
    await pool.query("DELETE FROM transactions WHERE user_id=$1 AND id=$2", [
      userId,
      id,
    ]);
    res.json({ message: "✅ Transaction deleted" });
  } catch (err) {
    console.error("❌ Delete Transaction Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================================================
// 🔹 BUDGETS ROUTES
// ===============================================================
app.get("/api/budgets/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM budgets WHERE user_id=$1 ORDER BY id",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets/:userId", async (req, res) => {
  const { userId } = req.params;
  const { category, amount } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO budgets (user_id, category, amount) VALUES ($1, $2, $3) RETURNING *",
      [userId, category, amount]
    );
    res.json({ budget: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add budget" });
  }
});

app.put("/api/budgets/:userId/:budgetId", async (req, res) => {
  const { userId, budgetId } = req.params;
  const { category, amount } = req.body;
  try {
    const result = await pool.query(
      "UPDATE budgets SET category=$1, amount=$2 WHERE id=$3 AND user_id=$4 RETURNING *",
      [category, amount, budgetId, userId]
    );
    res.json({ budget: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

app.delete("/api/budgets/:userId/:budgetId", async (req, res) => {
  const { userId, budgetId } = req.params;
  try {
    await pool.query("DELETE FROM budgets WHERE id=$1 AND user_id=$2", [
      budgetId,
      userId,
    ]);
    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

// ===============================================================
// 🔹 TOTAL BUDGET ROUTES
// ===============================================================
app.get("/api/totalBudget/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT total_budget FROM total_budget WHERE user_id=$1",
      [userId]
    );
    res.json({ totalBudget: result.rows[0]?.total_budget || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch total budget" });
  }
});

app.post("/api/totalBudget/:userId", async (req, res) => {
  const { userId } = req.params;
  const { totalBudget } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO total_budget (user_id, total_budget) 
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET total_budget = $2
       RETURNING *`,
      [userId, totalBudget]
    );
    res.json({ totalBudget: result.rows[0].total_budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set total budget" });
  }
});

// ===============================================================
// 🔹 SERVER START
// ===============================================================
// app.get("/", (req, res) => res.send("🚀 Backend running"));

// API routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Serve React app for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.listen(port, () =>
  console.log(`✅ Server running at http://localhost:${port}`)
);
