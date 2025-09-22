import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddTransaction from "./pages/AddTransactionPage";
import HomePage from "./pages/HomePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
// import Features from "./pages/Features";
import "./App.css";
import IncomePage from "./pages/IncomePage.jsx";
import ExpensesPage from "./pages/ExpensePage.jsx";
import ProfilePage from "./pages/Profilepage.jsx";
import BudgetPage from "./pages/Budgetpage.jsx";
import NotificationsPage from "./pages/NotificationPage.jsx";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/addTransaction" element={<AddTransaction />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/dashboardpage" element={<DashboardPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/expense" element={<ExpensesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;
