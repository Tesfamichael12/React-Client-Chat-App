import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";
import Login from "./components/Login";
import Signup from "./components/Signup";

const App = () => {
  const [page, setPage] = useState("login"); // 'login', 'signup', 'chat'
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("chat");
  };
  const handleSignup = (userData) => {
    setUser(userData);
    setPage("chat");
  };

  return (
    <>
      {page === "login" && (
        <Login onLogin={handleLogin} onSwitch={() => setPage("signup")} />
      )}
      {page === "signup" && (
        <Signup onSignup={handleSignup} onSwitch={() => setPage("login")} />
      )}
      {page === "chat" && <ChatRoom user={user} />}
    </>
  );
};

export default App;
