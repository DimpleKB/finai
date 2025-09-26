import React, { createContext, useContext, useState, useEffect } from "react";

// 1️⃣ Create context
const UserContext = createContext();

// 2️⃣ Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem("userId") || null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (currentUserId) localStorage.setItem("userId", currentUserId);
    else localStorage.removeItem("userId");
  }, [currentUserId]);

  return (
    <UserContext.Provider value={{ user, setUser, currentUserId, setCurrentUserId }}>
      {children}
    </UserContext.Provider>
  );
};

// 3️⃣ Custom hook (named export)
export const useUser = () => useContext(UserContext);
