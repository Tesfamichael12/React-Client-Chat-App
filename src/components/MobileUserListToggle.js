import React from "react";
import { FaUsers, FaTimes } from "react-icons/fa"; // Import FaTimes

export default function MobileUserListToggle({ onClick, isOpen }) {
  return (
    <button
      className={`mobile-userlist-toggle${isOpen ? " open" : ""}`}
      aria-label={isOpen ? "Hide user list" : "Show user list"} // Update aria-label
      onClick={onClick}
    >
      {isOpen ? (
        <FaTimes style={{ fontSize: "1.7rem" }} /> // Show FaTimes when open
      ) : (
        <FaUsers style={{ fontSize: "1.7rem" }} /> // Show FaUsers when closed
      )}
    </button>
  );
}
