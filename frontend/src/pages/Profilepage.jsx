import React, { useContext, useState } from "react";
import Sidebar from "../components/Sidebar";
import { UserContext } from "../context/UserContext";

function ProfilePage() {
  const { user, setUser } = useContext(UserContext);
  const [editField, setEditField] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(user?.profile_pic || null);

  if (!user)
    return (
      <div style={loadingStyle}>Loading...</div>
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
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
    if (user.password) formData.append("password", user.password);
    if (file) formData.append("profilePic", file);

    try {
      const res = await fetch(
        `http://localhost:5000/api/user/${localStorage.getItem("userId")}`,
        { method: "PUT", body: formData }
      );
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message);
      setUser(updated.user);
      setFile(null);
      alert("✅ Profile updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save changes: " + err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={contentStyle}>
        {/* Profile Header */}
        <div style={profileHeaderStyle}>
          <img
            src={
              filePreview
                ? filePreview.startsWith("data:")
                  ? filePreview
                  : `http://localhost:5000/uploads/${filePreview}`
                : "https://via.placeholder.com/150"
            }
            alt="profile"
            style={profilePicStyle}
          />
          <h2>{user.username}</h2>
          <p style={{ color: "#7f8c8d" }}>{user.email}</p>
        </div>

        {/* Profile Fields */}
        <div style={fieldsContainer}>
          <Field
            label="Name"
            name="username"
            value={user.username}
            editField={editField}
            setEditField={setEditField}
            handleChange={handleChange}
          />
          <Field
            label="Email"
            name="email"
            value={user.email}
            editField={editField}
            setEditField={setEditField}
            handleChange={handleChange}
          />
          <Field
            label="Password"
            name="password"
            value={user.password}
            editField={editField}
            setEditField={setEditField}
            handleChange={handleChange}
          />
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ cursor: "pointer" }}
            />
          </div>
          <button style={saveBtn} onClick={handleSave}>
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, editField, setEditField, handleChange }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label>{label}</label>
      {editField === name ? (
        <input
          type={name === "password" ? "password" : "text"}
          name={name}
          value={value || ""}
          onChange={handleChange}
          onBlur={() => setEditField("")}
          style={inputStyle}
          autoFocus
        />
      ) : (
        <div style={displayTextStyle}>
          {value || "---"}
          <span style={editIconStyle} onClick={() => setEditField(name)}>
            ✏️
          </span>
        </div>
      )}
    </div>
  );
}

// ====== Styles ======
const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  width: "100vw",
};

const contentStyle = {
  flex: 1,
  background: "#ecf0f1",
  padding: "20px",
  overflowY: "auto",
};

const profileHeaderStyle = {
  textAlign: "center",
  marginBottom: "30px",
};

const profilePicStyle = {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "4px solid #3498db",
  marginBottom: "15px",
};

const fieldsContainer = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const displayTextStyle = {
  padding: "12px",
  borderRadius: "8px",
  background: "#f0f0f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
};

const editIconStyle = { marginLeft: "10px", color: "#3498db", cursor: "pointer" };

const saveBtn = {
  background: "#3498db",
  color: "white",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  width: "100%",
};

const loadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  width: "100%",
};

export default ProfilePage;
