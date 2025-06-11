import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import "./ChatRoom.css";
import {
  FaChevronDown,
  FaChevronUp,
  FaPaperclip,
  FaTelegramPlane,
  FaUsers,
  FaVideo,
  FaPhoneAlt,
  FaCog,
  FaBell,
  FaPlusSquare,
} from "react-icons/fa";
import { MdMoreVert, MdOutlineAttachFile, MdSend } from "react-icons/md";
import MobileUserListToggle from "./MobileUserListToggle";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaCheckDouble } from "react-icons/fa";

const ChatRoom = ({ user }) => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [userData, setUserData] = useState({
    username: user?.username || "",
    userId: user?.userId || null,
    receivername: "",
    connected: false,
    message: "",
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [publicSubscription, setPublicSubscription] = useState(null);
  const [privateSubscription, setPrivateSubscription] = useState(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [filesData] = useState({
    photos: 115,
    files: 208,
    sharedLinks: 47,
  });
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUserData((prev) => ({
        ...prev,
        username: user.username,
        userId: user.userId || null,
      }));
    } else {
      setUserData((prev) => ({
        ...prev,
        username: "",
        userId: null,
        connected: false,
      }));
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!userData.username) {
      if (stompClient) {
        publicSubscription?.unsubscribe();
        privateSubscription?.unsubscribe();
        stompClient.disconnect(() => {});
        setStompClient(null);
        setPublicSubscription(null);
        setPrivateSubscription(null);
        setUserData((prev) => ({ ...prev, connected: false }));
      }
      return;
    }
    const sock = new SockJS("http://localhost:8080/ws");
    const client = over(sock);
    setStompClient(client);
    client.connect(
      {},
      () => {
        setUserData((prev) => ({ ...prev, connected: true }));
        publicSubscription?.unsubscribe();
        privateSubscription?.unsubscribe();
        const newPublicSub = client.subscribe(
          "/chatroom/public",
          onMessageReceived
        );
        const newPrivateSub = client.subscribe(
          `/user/${userData.username}/private`,
          onPrivateMessage
        );
        setPublicSubscription(newPublicSub);
        setPrivateSubscription(newPrivateSub);
        userJoin(userData.username, client);
      },
      (err) => {
        if (client) {
          try {
            client.disconnect(() => {});
          } catch (disconnectError) {}
        }
        setStompClient(null);
        setPublicSubscription(null);
        setPrivateSubscription(null);
        setUserData((prev) => ({
          ...prev,
          connected: false,
          message: prev.message,
          username: prev.username,
          receivername: prev.receivername,
        }));
      }
    );
    return () => {
      publicSubscription?.unsubscribe();
      privateSubscription?.unsubscribe();
      if (client && client.connected) {
        client.disconnect(() => {});
      } else if (client) {
        try {
          client.disconnect(() => {});
        } catch (disconnectError) {}
      }
      setStompClient(null);
      setPublicSubscription(null);
      setPrivateSubscription(null);
      setUserData((prev) => ({ ...prev, connected: false }));
    };
  }, [userData.username]);

  const userJoin = (currentUsername, clientInstance) => {
    if (clientInstance && clientInstance.connected && currentUsername) {
      const chatMessage = {
        senderName: currentUsername,
        status: "JOIN",
      };
      clientInstance.send("/chatroom/public", {}, JSON.stringify(chatMessage));
    }
  };

  const addNotification = (notif) => {
    setNotifications((prev) => {
      if (notif.id) {
        if (prev.some((n) => n.id === notif.id && n.type === notif.type))
          return prev;
      } else {
        if (
          prev.some((n) => n.message === notif.message && n.type === notif.type)
        )
          return prev;
      }
      return [notif, ...prev].slice(0, 30);
    });
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    const rawMessageBody = payload.body;

    switch (payloadData.status) {
      case "JOIN":
        addNotification({
          type: "join",
          user: payloadData.senderName,
          time: new Date().toISOString(),
          message: `${payloadData.senderName} joined the chat.`,
          id: payloadData.id || undefined,
        });
        if (!privateChats.get(payloadData.senderName)) {
          setPrivateChats((prev) => {
            const newMap = new Map(prev);
            newMap.set(payloadData.senderName, []);
            return newMap;
          });
        }
        setOnlineUsers((prev) => {
          if (!prev.includes(payloadData.senderName)) {
            return [...prev, payloadData.senderName];
          }
          return prev;
        });

        setPublicChats((prevPublicChats) => {
          const arr = Array.isArray(prevPublicChats) ? prevPublicChats : [];
          const alreadyExists = arr.some(
            (chat) => chat.rawBody === rawMessageBody && chat.type === "STATUS"
          );
          if (alreadyExists) {
            return arr;
          }
          return [
            ...arr,
            { ...payloadData, type: "STATUS", rawBody: rawMessageBody },
          ];
        });
        break;
      case "LEAVE":
        addNotification({
          type: "leave",
          user: payloadData.senderName,
          time: new Date().toISOString(),
          message: `${payloadData.senderName} left the chat.`,
          id: payloadData.id || undefined,
        });
        setOnlineUsers((prev) =>
          prev.filter((user) => user !== payloadData.senderName)
        );

        setPublicChats((prevPublicChats) => {
          const arr = Array.isArray(prevPublicChats) ? prevPublicChats : [];
          const alreadyExists = arr.some(
            (chat) => chat.rawBody === rawMessageBody && chat.type === "STATUS"
          );
          if (alreadyExists) {
            return arr;
          }
          return [...arr, { ...payloadData, type: "STATUS", rawMessageBody }];
        });
        break;
      case "MESSAGE":
        setPublicChats((prevPublicChats) => {
          const arr = Array.isArray(prevPublicChats) ? prevPublicChats : [];
          const messageExists = arr.some(
            (chat) =>
              chat.message === payloadData.message &&
              chat.senderName === payloadData.senderName &&
              chat.status === "MESSAGE"
          );
          if (!messageExists) {
            return [...arr, payloadData];
          }
          return arr;
        });
        break;
      default:
        break;
    }
  };

  const onPrivateMessage = (payload) => {
    let payloadData;
    try {
      payloadData = JSON.parse(payload.body);
    } catch (error) {
      return;
    }
    const currentUsername = userData.username;
    if (!payloadData.timestamp) {
      payloadData.timestamp = new Date().toISOString();
    }
    setPrivateChats((prevMap) => {
      const newMap = new Map(prevMap);
      let chatKey;
      let isEcho = false;
      if (payloadData.senderName === currentUsername) {
        if (!payloadData.receiverName) {
          return prevMap;
        }
        chatKey = payloadData.receiverName;
        isEcho = true;
      } else {
        chatKey = payloadData.senderName;
      }
      if (!chatKey) {
        return prevMap;
      }
      let messages = newMap.get(chatKey) || [];
      const serverMessage = { ...payloadData, isOptimistic: false };
      // Prevent duplicates for the other end user
      const alreadyExists = messages.some(
        (msg) =>
          msg.senderName === serverMessage.senderName &&
          msg.receiverName === serverMessage.receiverName &&
          msg.message === serverMessage.message &&
          (msg.date || msg.timestamp) ===
            (serverMessage.date || serverMessage.timestamp)
      );
      if (!alreadyExists) {
        messages = [...messages, serverMessage];
      }
      newMap.set(chatKey, messages);
      return newMap;
    });
    if (payloadData.senderName !== userData.username) {
      addNotification({
        type: "private-message",
        user: payloadData.senderName,
        time:
          payloadData.date || payloadData.timestamp || new Date().toISOString(),
        message: `New private message from ${payloadData.senderName}: ${payloadData.message}`,
        id: payloadData.id || undefined,
      });
    }
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData((prev) => ({ ...prev, message: value }));
  };
  const sendValue = () => {
    if (stompClient && userData.message.trim() && userData.connected) {
      const now = new Date();
      const clientTempId = `${
        userData.username
      }-${now.getTime()}-${Math.random()}`;
      var chatMessage = {
        senderName: userData.username,
        receiverName: "public",
        message: userData.message,
        date: now.toISOString(),
        status: "MESSAGE",
        clientTempId,
      };
      setPublicChats((prev) => [
        ...prev,
        { ...chatMessage, isOptimistic: true },
      ]);
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData((prev) => ({ ...prev, message: "" }));
    }
  };

  const sendPrivateValue = () => {
    if (stompClient && userData.message.trim() && userData.connected) {
      const now = new Date();
      const clientTempId = `${
        userData.username
      }-${now.getTime()}-${Math.random()}`;
      const chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        message: userData.message,
        date: now.toISOString(),
        status: "MESSAGE",
        clientTempId,
      };
      setPrivateChats((prevMap) => {
        const newMap = new Map(prevMap);
        const messages = newMap.get(tab) || [];
        newMap.set(tab, [...messages, { ...chatMessage, isOptimistic: true }]);
        return newMap;
      });
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData((prev) => ({ ...prev, message: "" }));
    }
  };

  const getAvatarUrl = (usernameOrId) => {
    if (!usernameOrId) {
      return `https://ui-avatars.com/api/?name=?&background=cccccc&color=fff&size=48`;
    }
    const str = String(usernameOrId);
    const stringToColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      let color = "#";
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += ("00" + value.toString(16)).slice(-2);
      }
      return color;
    };
    const firstLetter = str.charAt(0).toUpperCase();
    const bgColor = stringToColor(str).substring(1);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      firstLetter
    )}&background=${bgColor}&color=fff&size=48&font-size=0.5&bold=true`;
  };

  useEffect(() => {
    if (!isUserListOpen) return;
    const handleClick = (e) => {
      if (
        e.target.closest(".user-list-content") ||
        e.target.closest(".mobile-userlist-toggle")
      ) {
        return;
      }
      setIsUserListOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isUserListOpen]);

  useEffect(() => {
    if (userData.username && !userData.connected) {
      fetch("/api/messages/group?roomId=1")
        .then((res) => res.json())
        .then((messages) => {
          console.log("[REST API] Group messages:", messages);
          setPublicChats(
            (Array.isArray(messages) ? messages : []).map((msg) => ({
              senderName: msg.sender_name || msg.sender_id,
              receiverName: msg.receiver_name || msg.receiver_id,
              message: msg.message,
              date: msg.sent_at,
              status: msg.status || "MESSAGE",
              id: msg.id,
              fileId: msg.file_id,
              isRight: msg.sender_id === userData.userId,
            }))
          );
        });
    }
  }, [userData.username, userData.connected, userData.userId]);

  useEffect(() => {
    if (userData.username && tab !== "CHATROOM") {
      fetch(`/api/messages/private?user1=${userData.username}&user2=${tab}`)
        .then((res) => res.json())
        .then((messages) => {
          console.log("[REST API] Private messages:", messages);
          setPrivateChats((prev) => {
            const newMap = new Map(prev);
            const mapped = (Array.isArray(messages) ? messages : []).map(
              (msg) => ({
                senderName: msg.sender_name || msg.sender_id,
                receiverName: msg.receiver_name || msg.receiver_id,
                message: msg.message,
                date: msg.sent_at,
                status: msg.status || "MESSAGE",
                id: msg.id,
                fileId: msg.file_id,
                isRight: msg.receiver_id === userData.userId,
              })
            );
            newMap.set(tab, mapped);
            return newMap;
          });
        });
    }
  }, [userData.username, tab, userData.userId]);

  return (
    <div className="layout">
      {isMobile && (
        <>
          <MobileUserListToggle
            onClick={() => setIsUserListOpen((v) => !v)}
            isOpen={isUserListOpen}
          />
          <div
            className={`user-list-overlay${isUserListOpen ? " open" : ""}`}
            style={{ display: isUserListOpen ? "block" : "none", zIndex: 2000 }}
          >
            <div className="user-list-content">
              <div
                className="chat-list-column"
                style={{
                  marginTop: "10px",
                  width: "100%",
                  height: "100vh",
                }}
              >
                <div className="chat-list-header">
                  <h2>Afro Chat</h2>
                  <FaPlusSquare
                    style={{ cursor: "pointer", fontSize: "1.2rem" }}
                  />
                </div>
                <div className="chat-list-item-container">
                  <div
                    className={`chat-list-item ${
                      tab === "CHATROOM" ? "active" : ""
                    }`}
                    onClick={() => {
                      setTab("CHATROOM");
                      setIsUserListOpen(false);
                    }}
                  >
                    <img
                      src={getAvatarUrl("Afro Chat")}
                      alt="Afro Chat"
                      className="chat-list-item-avatar"
                    />
                    <div className="chat-list-item-content">
                      <p className="chat-list-item-name">Afro Chat</p>
                      <p
                        className={`chat-list-item-preview ${
                          tab === "CHATROOM" ? "active" : ""
                        }`}
                      >
                        {publicChats.length > 0
                          ? `${
                              publicChats[publicChats.length - 1].senderName
                            }: ${publicChats[publicChats.length - 1].message}`
                          : "Start messaging..."}
                      </p>
                    </div>
                  </div>
                  {[...privateChats.keys()].map((name, index) => (
                    <div
                      key={index}
                      className={`chat-list-item ${
                        tab === name ? "active" : ""
                      }`}
                      onClick={() => {
                        setTab(name);
                        setIsUserListOpen(false);
                      }}
                    >
                      <img
                        src={getAvatarUrl(name)}
                        alt={name}
                        className="chat-list-item-avatar"
                      />
                      <div className="chat-list-item-content">
                        <p className="chat-list-item-name">{name}</p>
                        <p
                          className={`chat-list-item-preview ${
                            tab === name ? "active" : ""
                          }`}
                        >
                          {privateChats.get(name) &&
                          privateChats.get(name).length > 0
                            ? `${privateChats
                                .get(name)
                                [
                                  privateChats.get(name).length - 1
                                ].message.substring(0, 30)}...`
                            : "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {!isMobile && (
        <div className="chat-list-column" style={{ marginTop: "-10px" }}>
          <div className="chat-list-header">
            <h2>Afro Chat</h2>
            <FaPlusSquare style={{ cursor: "pointer", fontSize: "1.2rem" }} />
          </div>
          <div className="chat-list-item-container">
            <div
              className={`chat-list-item ${tab === "CHATROOM" ? "active" : ""}`}
              onClick={() => setTab("CHATROOM")}
            >
              <img
                src={getAvatarUrl("Afro Chat")}
                alt="Afro Chat"
                className="chat-list-item-avatar"
              />
              <div className="chat-list-item-content">
                <p className="chat-list-item-name">Afro Chat</p>
                <p
                  className={`chat-list-item-preview ${
                    tab === "CHATROOM" ? "active" : ""
                  }`}
                >
                  {publicChats.length > 0
                    ? `${publicChats[publicChats.length - 1].senderName}: ${
                        publicChats[publicChats.length - 1].message
                      }`
                    : "Start messaging..."}
                </p>
              </div>
            </div>
            {[...privateChats.keys()].map((name, index) => (
              <div
                key={index}
                className={`chat-list-item ${tab === name ? "active" : ""}`}
                onClick={() => setTab(name)}
              >
                <img
                  src={getAvatarUrl(name)}
                  alt={name}
                  className="chat-list-item-avatar"
                />
                <div className="chat-list-item-content">
                  <p className="chat-list-item-name">{name}</p>
                  <p
                    className={`chat-list-item-preview ${
                      tab === name ? "active" : ""
                    }`}
                  >
                    {privateChats.get(name) && privateChats.get(name).length > 0
                      ? `${privateChats
                          .get(name)
                          [privateChats.get(name).length - 1].message.substring(
                            0,
                            30
                          )}...`
                      : "No messages yet"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="chat-area-column">
        <div className="chat-header">
          <div className="chat-header-info">
            <img
              src={getAvatarUrl(tab === "CHATROOM" ? "Afro Chat" : tab)}
              alt={tab}
              className="chat-list-item-avatar"
              style={{ width: "40px", height: "40px" }}
            />
            <h2>{tab === "CHATROOM" ? "Afro Chat" : tab}</h2>
          </div>
          <div className="chat-header-icons">
            <FaPhoneAlt
              style={{ cursor: "pointer" }}
              title="Call user"
              onClick={() => {
                window.open("tel:+1234567890", "_self");
              }}
            />
            <FaVideo
              style={{ cursor: "pointer" }}
              title="Start Google Meet"
              onClick={() => {
                window.open("https://meet.google.com/new", "_blank");
              }}
            />
            <MdMoreVert />
          </div>
        </div>
        <div className="messages-container" style={{ position: "relative" }}>
          <AnimatePresence initial={false}>
            {(tab === "CHATROOM"
              ? publicChats
              : privateChats.get(tab) || []
            ).map((chat, index) => (
              <React.Fragment key={index}>
                {chat.type === "STATUS" && chat.status === "JOIN" && (
                  <motion.div
                    className="chat-status-update join"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {chat.senderName} joined the chat.
                  </motion.div>
                )}
                {chat.type === "STATUS" && chat.status === "LEAVE" && (
                  <motion.div
                    className="chat-status-update leave"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {chat.senderName} left the chat.
                  </motion.div>
                )}
                {chat.status === "MESSAGE" && (
                  <motion.div
                    className={`message-bubble ${chat.isRight ? "self" : ""}`}
                    initial={{
                      opacity: 0,
                      x: chat.isRight ? 60 : -60,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: chat.isRight ? 60 : -60,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {!chat.isRight && (
                      <img
                        src={getAvatarUrl(chat.senderName)}
                        alt={chat.senderName}
                        className="message-avatar"
                      />
                    )}
                    <div className="message-content">
                      <div className="message-sender-name">
                        {chat.isRight ? "You" : chat.senderName}
                      </div>
                      <p className="message-text">{chat.message}</p>
                      <div className="message-metadata">
                        <span className="message-timestamp">
                          {chat.date
                            ? new Date(chat.date).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : chat.timestamp
                            ? new Date(chat.timestamp).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
                            : ""}
                        </span>
                        {chat.isRight && (
                          <span className="message-status-text">
                            {chat.statusValue === "SEEN" ? (
                              <FaCheckDouble className="message-status-icon seen" />
                            ) : chat.statusValue === "DELIVERED" ? (
                              <FaCheckDouble className="message-status-icon delivered" />
                            ) : (
                              <FaCheck className="message-status-icon sent" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {chat.isRight && (
                      <img
                        src={getAvatarUrl(chat.senderName)}
                        alt={chat.senderName}
                        className="message-avatar"
                      />
                    )}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>
        <div className="message-input-container">
          <input
            type="file"
            id="file-upload-input"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
                setShowUpload(true);
              }
            }}
            accept="image/*,video/*,audio/*,application/pdf"
          />
          <button
            className="input-icon-button"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("file-upload-input").click();
            }}
            title="Attach file"
          >
            <MdOutlineAttachFile />
          </button>
          <input
            type="text"
            placeholder="Write a message..."
            value={userData.message}
            onChange={handleMessage}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                tab === "CHATROOM" ? sendValue() : sendPrivateValue();
              }
            }}
            className="message-input"
          />
          <button
            className="input-icon-button"
            onClick={tab === "CHATROOM" ? sendValue : sendPrivateValue}
          >
            <MdSend />
          </button>
        </div>
        {showUpload && selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              bottom: 80,
              left: 0,
              right: 0,
              margin: "auto",
              width: 320,
              background: "#1e293b",
              borderRadius: 12,
              boxShadow: "0 4px 24px #0002",
              padding: 24,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ marginBottom: 12, color: "#fff", fontWeight: 600 }}>
              {selectedFile.name}
            </div>
            <button
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 8,
              }}
              onClick={async () => {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("uploaderId", userData.userId);
                try {
                  const response = await fetch(
                    "http://localhost:8080/api/files/upload",
                    {
                      method: "POST",
                      body: formData,
                    }
                  );
                  const data = await response.json();
                  if (tab === "CHATROOM") {
                    setPublicChats((prev) => [
                      ...prev,
                      {
                        senderName: userData.username,
                        message: `📎 <a href='${
                          data.fileUrl
                        }' target='_blank' rel='noopener noreferrer'>${
                          data.fileName ||
                          data.originalName ||
                          data.name ||
                          "File"
                        }</a> uploaded.`,
                        status: "MESSAGE",
                        timestamp: new Date().toISOString(),
                        isSystem: true,
                        isFile: true,
                      },
                    ]);
                  } else {
                    setPrivateChats((prevMap) => {
                      const newMap = new Map(prevMap);
                      const messages = newMap.get(tab) || [];
                      newMap.set(tab, [
                        ...messages,
                        {
                          senderName: userData.username,
                          message: `📎 <a href='${
                            data.fileUrl
                          }' target='_blank' rel='noopener noreferrer'>${
                            data.fileName ||
                            data.originalName ||
                            data.name ||
                            "File"
                          }</a> uploaded.`,
                          status: "MESSAGE",
                          timestamp: new Date().toISOString(),
                          isSystem: true,
                          isFile: true,
                        },
                      ]);
                      return newMap;
                    });
                  }
                  setShowUpload(false);
                  setSelectedFile(null);
                } catch (err) {
                  alert("Upload failed.");
                } finally {
                  setUploading(false);
                }
              }}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              style={{
                background: "none",
                color: "#f87171",
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
      {!isMobile && (
        <div className="info-column">
          <div className="info-header">
            <input
              type="text"
              placeholder="Search"
              className="global-search-input"
            />
            <div className="header-icon-group">
              <FaCog />
              <div style={{ position: "relative" }}>
                <FaBell
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowNotifications((v) => !v)}
                />
                {notifications.length > 0 && (
                  <span className="notification-badge">
                    {notifications.length}
                  </span>
                )}
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications</div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div
                          key={idx}
                          className={`notification-item notification-${notif.type}`}
                          style={{
                            cursor:
                              notif.type === "private-message"
                                ? "pointer"
                                : "default",
                          }}
                          onClick={() => {
                            setShowNotifications(false);
                            if (notif.type === "private-message") {
                              setTab(notif.user);
                            } else if (
                              notif.type === "join" ||
                              notif.type === "leave"
                            ) {
                              setTab("CHATROOM");
                            }
                          }}
                        >
                          <span className="notification-user">
                            {notif.user}
                          </span>
                          <span className="notification-message">
                            {notif.message}
                          </span>
                          <span className="notification-time">
                            {new Date(notif.time).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <img
                src={getAvatarUrl(userData.username)}
                alt={userData.username}
                className="user-avatar-icon"
              />
            </div>
          </div>
          <div className="action-buttons-bar">
            <button
              className="action-button active"
              title="Call"
              onClick={() => window.open("tel:+1234567890", "_self")}
            >
              <FaPhoneAlt />
            </button>
            <button
              className="action-button"
              title="Video Call"
              onClick={() =>
                window.open("https://meet.google.com/new", "_blank")
              }
            >
              <FaVideo />
            </button>
            <button className="action-button" title="Add Members">
              <FaUsers />
            </button>
            <button className="action-button" title="More Options">
              <MdMoreVert />
            </button>
          </div>
          <div className="section-title">
            <h3>Online Users</h3>
          </div>
          <div className="member-list">
            <div className="member-item" onClick={() => {}}>
              <div className="member-avatar">
                <img
                  src={getAvatarUrl(userData.username)}
                  alt={userData.username}
                />
                <span className="online-indicator" />
              </div>
              <p className="member-name">You</p>
            </div>
            {onlineUsers
              .filter((name) => name !== userData.username)
              .map((name) => {
                return (
                  <div
                    key={name}
                    className="member-item"
                    onClick={() => setTab(name)}
                    title={`Chat with ${name}`}
                  >
                    <div className="member-avatar">
                      <img src={getAvatarUrl(name)} alt={name} />
                      <span className="online-indicator" />
                    </div>
                    <p className="member-name">{name}</p>
                  </div>
                );
              })}
          </div>
          <div className="files-section">
            <div
              className="section-title"
              onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
              style={{ cursor: "pointer" }}
            >
              Files
              {isPhotosExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {isPhotosExpanded && (
              <>
                <div className="file-category" onClick={() => {}}>
                  <FaPlusSquare />
                  <span>{filesData.photos} photos</span>
                  <FaChevronDown />
                </div>
                <div className="file-category" onClick={() => {}}>
                  <FaPaperclip />
                  <span>{filesData.files} files</span>
                  <FaChevronDown />
                </div>
                <div className="file-category" onClick={() => {}}>
                  <FaTelegramPlane />
                  <span>{filesData.sharedLinks} shared links</span>
                  <FaChevronDown />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
