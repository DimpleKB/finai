import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useUser } from "../context/UserContext";

function ProfilePage() {
  const { user, setUser, currentUserId } = useUser();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(user?.profile_pic || null);

  useEffect(() => {
    setFilePreview(user?.profile_pic || null);
  }, [user]);

  if (!user) return <div>Loading...</div>;

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
      const res = await fetch(`http://localhost:5000/api/user/${currentUserId}`, {
        method: "PUT",
        body: formData,
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message);
      setUser(updated.user);
      setFile(null);
      alert("✅ Profile updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div>
        <h2>{user.username}</h2>
        <p>{user.email}</p>
        <img
          src={filePreview?.startsWith("data:") ? filePreview : `http://localhost:5000/uploads/${filePreview}`}
          alt="profile"
          width="150"
        />
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

export default ProfilePage;
