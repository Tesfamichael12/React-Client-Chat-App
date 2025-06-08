import React from "react";

export default function MobileUserListToggle({ onClick, isOpen }) {
  return (
    <button
      className={`mobile-userlist-toggle${isOpen ? " open" : ""}`}
      aria-label="Show user list"
      onClick={onClick}
    >
      {/* Hamburger icon */}
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
    </button>
  );
}
