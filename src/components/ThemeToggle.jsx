import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import styled from "styled-components";

const Toggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  color: ${({ theme }) => theme.primary};
  font-size: 1.5rem;
  z-index: 10;
`;

export default function ThemeToggle({ toggleTheme, theme }) {
  return (
    <Toggle onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "light" ? <FaMoon /> : <FaSun />}
    </Toggle>
  );
}
