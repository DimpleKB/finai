import React, { createContext, useState, useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem("userId") || null);
  const [user, setUser] = useState(null);

  // Fetch user data whenever currentUserId changes
  useEffect(() => {
    if (!currentUserId) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${currentUserId}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [currentUserId]);

  return (
    <UserContext.Provider value={{ currentUserId, setCurrentUserId, user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easier use
export const useUser = () => useContext(UserContext);
