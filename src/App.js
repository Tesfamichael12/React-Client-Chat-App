import React, { useState } from "react";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { lightTheme, darkTheme } from "./styles/colors";
import useDarkMode from "./hooks/useDarkMode";
import ThemeToggle from "./components/ThemeToggle";
import ChatRoom from "./components/ChatRoom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import styled from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    transition: background 0.3s, color 0.3s;
    font-family: 'Jost', sans-serif;
  }
`;

const ToggleWrapper = styled.div`
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10000;
`;

const App = () => {
  const [theme, toggleTheme] = useDarkMode();
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
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <GlobalStyle />
      {page === "chat" && (
        <ToggleWrapper>
          <ThemeToggle toggleTheme={toggleTheme} theme={theme} />
        </ToggleWrapper>
      )}
      {page === "login" && (
        <Login onLogin={handleLogin} onSwitch={() => setPage("signup")} />
      )}
      {page === "signup" && (
        <Signup onSignup={handleSignup} onSwitch={() => setPage("login")} />
      )}
      {page === "chat" && <ChatRoom user={user} />}
    </ThemeProvider>
  );
};

export default App;
