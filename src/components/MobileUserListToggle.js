import React from "react";
import { FaUsers } from "react-icons/fa";

export default function MobileUserListToggle({ onClick, isOpen }) {
  return (
    <button
      className={`mobile-userlist-toggle${isOpen ? " open" : ""}`}
      aria-label="Show user list"
      onClick={onClick}
    >
      <FaUsers style={{ fontSize: "1.7rem" }} />
    </button>
  );
}
