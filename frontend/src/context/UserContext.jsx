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

  // Keep localStorage in sync when user changes
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // Keep localStorage in sync when userId changes
  useEffect(() => {
    if (currentUserId) localStorage.setItem("userId", currentUserId);
    else localStorage.removeItem("userId");
  }, [currentUserId]);

  // Optional: auto-load data on mount (not needed since you use lazy init)
  // useEffect(() => {
  //   const savedUser = JSON.parse(localStorage.getItem("user"));
  //   const savedUserId = localStorage.getItem("userId");
  //   if (savedUser) setUser(savedUser);
  //   if (savedUserId) setCurrentUserId(savedUserId);
  // }, []);

  return (
    <UserContext.Provider value={{ user, setUser, currentUserId, setCurrentUserId }}>
      {children}
    </UserContext.Provider>
  );
};

// 3️⃣ Custom hook
export const useUser = () => useContext(UserContext);
