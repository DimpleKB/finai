import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext.jsx";

function ProfilePage() {
  const { user, setUser, currentUserId } = useUser();
  const { darkMode, toggleDarkMode } = useTheme();

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(user?.profile_pic || "/default-avatar.png");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!user?.username);
  const [password, setPassword] = useState("");

  // Bank connection states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankName, setBankName] = useState("");

  // Fetch user if not loaded
  useEffect(() => {
    if (!user?.username && currentUserId) {
      fetch(`http://localhost:5000/api/user/${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setFilePreview(data.profile_pic ? `http://localhost:5000/uploads/${data.profile_pic}` : "/default-avatar.png");
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user, currentUserId, setUser]);

  // Update preview when user changes
  useEffect(() => {
    setFilePreview(user?.profile_pic ? `http://localhost:5000/uploads/${user.profile_pic}` : "/default-avatar.png");
  }, [user]);

  if (loading) return <div>Loading user data...</div>;

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    if (user.username) formData.append("username", user.username);
    if (user.email) formData.append("email", user.email);
    if (password.trim()) formData.append("password", password);
    if (file) formData.append("profilePic", file);

    try {
      setSaving(true);
      const res = await fetch(`http://localhost:5000/api/user/${currentUserId}`, {
        method: "PUT",
        body: formData,
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || "Failed to save");

      setUser(updated.user);
      setFile(null);
      setPassword("");
      alert("✅ Profile updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== Bank connect =====
  const handleBankConnect = async (bankName) => {
    try {
      const consentId = "sandbox_consent_" + Date.now(); // simulate sandbox consent

      // Save consent in backend
      await fetch(`http://localhost:5000/api/bank/connect/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, consentId }),
      });

      // Fetch transactions automatically
      const res = await fetch(`http://localhost:5000/api/bank/fetch-transactions/${user.id}`, {
        method: "POST",
      });
      const data = await res.json();

      alert(`✅ Bank connected! Fetched ${data.count} transactions.`);
      setShowBankModal(false);
      setBankName("");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to connect bank");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar darkMode={darkMode} />
      <div style={{ flex: 1, padding: "30px", maxWidth: "800px", marginLeft: "300px" }}>
        <div style={{ ...cardStyle, background: darkMode ? "#2c2c3e" : "#fff", width: "1000px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px", color: darkMode ? "#4fc3f7" : "#236fbc" }}>Profile</h2>
            <button onClick={toggleDarkMode} style={modeBtnStyle}>
              {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <img
              src={filePreview}
              alt="profile"
              style={{ ...profileImgStyle, boxShadow: darkMode ? "0 0 15px #4fc3f7" : "0 4px 20px rgba(0,0,0,0.1)" }}
            />
            <input type="file" onChange={handleFileChange} style={fileInputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <label style={labelStyle}>
              Username
              <input type="text" name="username" value={user.username || ""} onChange={handleChange}
                style={{ ...inputStyle, background: darkMode ? "#3b3b50" : "#fff", color: darkMode ? "#f0f0f0" : "#333" }}
              />
            </label>

            <label style={labelStyle}>
              Email
              <input type="email" name="email" value={user.email || ""} onChange={handleChange}
                style={{ ...inputStyle, background: darkMode ? "#3b3b50" : "#fff", color: darkMode ? "#f0f0f0" : "#333" }}
              />
            </label>

            <label style={labelStyle}>
              Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, background: darkMode ? "#3b3b50" : "#fff", color: darkMode ? "#f0f0f0" : "#333" }}
                placeholder="Enter new password"
              />
            </label>

            <button onClick={handleSave} disabled={saving} style={{ ...saveBtnStyle, background: darkMode ? "#4fc3f7" : "#236fbc" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <p style={{ fontSize: "12px", textAlign: "center", color: darkMode ? "#aaa" : "#666" }}>
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Styles =====
const cardStyle = { borderRadius: "12px", padding: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", transition: "0.3s all" };
const profileImgStyle = { width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", border: "4px solid #236fbc", marginBottom: "10px", transition: "0.3s all" };
const fileInputStyle = { display: "block", margin: "10px auto 0" };
const labelStyle = { display: "flex", flexDirection: "column", fontWeight: "600", color: "#333" };
const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginTop: "5px", fontSize: "16px", outline: "none" };
const saveBtnStyle = { padding: "12px", borderRadius: "8px", color: "#fff", fontWeight: "600", fontSize: "16px", cursor: "pointer", marginTop: "20px", border: "none", transition: "0.2s all" };
const modeBtnStyle = { padding: "8px 15px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", background: "#f0f0f0", color: "#333" };
const modalStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
  zIndex: 1000,
  minWidth: "300px",
  textAlign: "center",
};

export default ProfilePage;

