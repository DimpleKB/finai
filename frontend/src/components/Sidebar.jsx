import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Sidebar = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { name: "Home", icon: "🏠", path: "/homepage" },
    { name: "Dashboard", icon: "📊", path: "/dashboardpage" },
    { name: "Add Transaction", icon: "➕", path: "/addtransaction" },
    { name: "Income", icon: "💰", path: "/income" },
    { name: "Expense", icon: "💸", path: "/expense" },
    { name: "Profile", icon: "👤", path: "/profile" },
    { name: "Budget", icon: "📋", path: "/budget" },
    { name: "Notifications", icon: "🔔", path: "/notifications" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div style={sidebarStyle}>
      <div>
        <div style={userInfoStyle}>
          <h2>FINAI</h2>
          <img
            src={user?.profile_pic ? `http://localhost:5000/uploads/${user.profile_pic}` : "https://via.placeholder.com/80"}
            alt="Profile"
            style={profilePicStyle}
          />
          <h3>{user?.username || "User"}</h3>
        </div>

        {items.map(item => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              ...linkStyle,
              background: location.pathname === item.path ? "#236fbcff" : "transparent",
              color:location.pathname === item.path ? "white" : "black"
            }}
          >
            <span style={{ marginRight: "10px" }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </div>

      <button onClick={handleLogout} style={logoutBtnStyle}>
        🔓 Logout
      </button>
    </div>
  );
};

const sidebarStyle = {
  width: "250px",
  background: "#05488bff",
  color: "#111213ff",
  padding: "30px 20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "100vh",
  boxShadow: "2px 0 5px rgba(0,0,0,0.2)"
};

const userInfoStyle = { textAlign: "center", marginBottom: "30px",color:"white" };
const profilePicStyle = { width: "80px", height: "80px", borderRadius: "50%", marginBottom: "10px", border: "2px solid #fff", objectFit: "cover" };
const linkStyle = {
  color: "#121212ff",
  marginBottom: "15px",
  padding: "10px 15px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  transition: "all 0.3s",
  cursor: "pointer"
};
const logoutBtnStyle = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#e74c3c",
  color: "#050404ff",
  fontWeight: "600",
  cursor: "pointer"
};

export default Sidebar;
