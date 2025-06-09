import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const Container = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url("/assets/images/bg-auth.png") center center/cover no-repeat;
  @media (max-width: 900px) {
    flex-direction: column;
    background-position: top;
  }
`;
const AuthWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  background: transparent;
  width: 800px;
  min-height: 500px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border-radius: 1.5rem;
  overflow: hidden;
  @media (max-width: 900px) {
    flex-direction: column;
    width: 95vw;
    min-height: 0;
  }
`;
const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50%;
  min-width: 350px;
  max-width: 400px;
  padding: 2.5rem 2rem 2rem 2rem;
  box-sizing: border-box;
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  color: #f8fafc;
  text-shadow: 0 1px 8px rgba(30, 41, 59, 0.25);
  @media (max-width: 900px) {
    width: 100%;
    min-width: 0;
    max-width: 100vw;
    border-radius: 0;
  }
`;
const SideImage = styled.div`
  width: 50%;
  background: url("/assets/images/bg-auth-2.png") center center/cover no-repeat;
  @media (max-width: 900px) {
    display: none;
  }
`;
const Form = styled.form`
  width: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
`;
const Title = styled.h2`
  color: #f8fafc;
  margin-bottom: 1.5rem;
  text-shadow: 0 1px 8px rgba(30, 41, 59, 0.25);
`;
const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: none;
  outline: none;
  margin-bottom: 1rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.25);
  color: #f8fafc;
  box-shadow: 0 1px 8px rgba(30, 41, 59, 0.1);
  &::placeholder {
    color: #e0e7ef;
    opacity: 1;
  }
`;
const Button = styled.button`
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  margin-top: 0.5rem;
  transition: background 0.2s;
  box-shadow: 0 1px 8px rgba(30, 41, 59, 0.1);
  width: 100%;
  &:hover {
    background: #0369a1;
  }
`;
const SwitchText = styled.p`
  margin-top: 1.5rem;
  color: #f8fafc;
  font-size: 0.95rem;
  text-align: center;
  text-shadow: 0 1px 8px rgba(30, 41, 59, 0.25);
`;
const Link = styled.span`
  color: #03feff;
  cursor: pointer;
  font-weight: bold;
  margin-left: 0.3rem;
  text-shadow: 0 0 8px #1e293b, 0 1px 8px #1e293b, 0 0 2px #1e293b,
    0 0 1px #1e293b;
`;

export default function Signup({ onSignup, onSwitch }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });
      const data = await res.json();
      if (data.success) {
        onSignup(data.user);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <Container>
      <AuthWrapper>
        <Card
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Sign Up</Title>
          <Form onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Display Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {error && (
              <div style={{ color: "#f87171", marginBottom: 8 }}>{error}</div>
            )}
            <Button type="submit">Sign Up</Button>
          </Form>
          <SwitchText>
            Already have an account?
            <Link onClick={onSwitch}>Sign in</Link>
          </SwitchText>
        </Card>
        <SideImage />
      </AuthWrapper>
    </Container>
  );
}
