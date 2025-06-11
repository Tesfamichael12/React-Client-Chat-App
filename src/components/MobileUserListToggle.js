import React from "react";
import { FaUsers, FaTimes } from "react-icons/fa";

export default function MobileUserListToggle({ onClick, isOpen }) {
  return (
    <button
      className={`mobile-userlist-toggle${isOpen ? " open" : ""}`}
      aria-label={isOpen ? "Hide user list" : "Show user list"}
      onClick={onClick}
    >
      {isOpen ? (
        <FaTimes style={{ fontSize: "1.7rem" }} />
      ) : (
        <FaUsers style={{ fontSize: "1.7rem" }} />
      )}
    </button>
  );
}
