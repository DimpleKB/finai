import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useUser } from "../context/UserContext";

function ProfilePage() {
  const { user, setUser, currentUserId } = useUser();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(user?.profile_pic || null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!user?.username);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user?.username && currentUserId) {
      fetch(`http://localhost:5000/api/user/${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setFilePreview(data.profile_pic || null);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user, currentUserId, setUser]);

  useEffect(() => {
    setFilePreview(user?.profile_pic || null);
  }, [user]);

  if (loading) return <div>Loading user data...</div>;

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f8" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "30px",width:"1000px" }}>
        <div style={{ ...cardStyle, width: "100%" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#236fbc" }}>Profile</h2>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src={
                filePreview
                  ? filePreview.startsWith("data:")
                    ? filePreview
                    : `http://localhost:5000/uploads/${filePreview}`
                  : "/default-avatar.png"
              }
              alt="profile"
              style={profileImgStyle}
            />
            <input type="file" onChange={handleFileChange} style={fileInputStyle} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <label style={labelStyle}>
              Username
              <input
                type="text"
                name="username"
                value={user.username || ""}
                onChange={handleChange}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email
              <input
                type="email"
                name="email"
                value={user.email || ""}
                onChange={handleChange}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Enter new password"
              />
            </label>

            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Styles =====
const cardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "30px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
};

const profileImgStyle = {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "4px solid #236fbc",
  marginBottom: "10px",
};

const fileInputStyle = {
  display: "block",
  margin: "10px auto 0",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontWeight: "600",
  color: "#333",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  marginTop: "5px",
  fontSize: "16px",
};

const saveBtnStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "#236fbc",
  color: "#fff",
  fontWeight: "600",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "20px",
  border: "none",
};

export default ProfilePage;
