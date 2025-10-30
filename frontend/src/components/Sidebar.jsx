import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const Sidebar = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // get dark mode state

  const items = [
    { name: "Home", icon: "🏠", path: "/homepage" },
    { name: "Dashboard", icon: "📊", path: "/dashboardpage" },
    { name: "Add Transaction", icon: "➕", path: "/addtransaction" },
    { name: "Profile", icon: "👤", path: "/profile" },
    { name: "Budget", icon: "📋", path: "/budget" },
    { name: "Notifications", icon: "🔔", path: "/notifications" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Colors based on theme
  const bgColor = darkMode ? "#121212" : "#0d47a1";
  const linkDefault = darkMode ? "#b0bec5" : "#cfd8dc";
  const linkActive = darkMode ? "#64b5f6" : "#fff";
  const profileBorder = darkMode ? "#64b5f6" : "#42a5f5";
  const logoutColor = darkMode ? "#ef5350" : "#e53935";

  return (
    <div
      style={{
        ...sidebarStyle,
        background: bgColor,
        color: linkDefault,
      }}
    >
      <div>
        {/* User Info */}
        <div style={userInfoStyle}>
          <h2 style={{ marginBottom: "15px", color: linkActive }}>FINAI</h2>
          <img
            src={
              user?.profile_pic
                ? `http://localhost:5000/uploads/${user.profile_pic}`
                : "https://via.placeholder.com/80"
            }
            alt="Profile"
            style={{ ...profilePicStyle, border: `3px solid ${profileBorder}` }}
          />
          <h3 style={{ marginTop: "10px", fontWeight: "500", color: linkActive }}>
            {user?.username || "User"}
          </h3>
        </div>

        {/* Navigation Links */}
        {items.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              ...linkStyle,
              background: location.pathname === item.path ? linkActive : "transparent",
              color: location.pathname === item.path ? (darkMode ? "#121212" : "black") : linkDefault,
            }}
          >
            <span style={{ marginRight: "12px", fontSize: "18px" }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{ ...logoutBtnStyle, background: logoutColor }}
        onMouseEnter={(e) => (e.currentTarget.style.background = darkMode ? "#e53935" : "#d32f2f")}
        onMouseLeave={(e) => (e.currentTarget.style.background = logoutColor)}
      >
        🔓 Logout
      </button>
    </div>
  );
};

// Sidebar styles
const sidebarStyle = {
  height: "700px",
  width: "260px",
  padding: "30px 20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "fixed",
  top: 0,
  left: 0,
  boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
  fontFamily: "Poppins, sans-serif",
  zIndex: 100,
  transition: "background 0.3s, color 0.3s",
};

const userInfoStyle = {
  textAlign: "center",
  marginBottom: "40px",
};

const profilePicStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  marginBottom: "10px",
  objectFit: "cover",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  transition: "border 0.3s",
};

const linkStyle = {
  marginBottom: "5px",
  padding: "12px 15px",
  borderRadius: "10px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  transition: "all 0.3s",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "16px",
};

const logoutBtnStyle = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.3s",
};

export default Sidebar;
