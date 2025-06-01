import { useState, useEffect } from "react";

export default function useDarkMode() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
  }, []);
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  return [theme, toggleTheme];
}
