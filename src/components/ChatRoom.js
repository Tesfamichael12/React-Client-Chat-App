import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import "./ChatRoom.css";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
  FaPaperclip,
  FaTelegramPlane,
  FaUsers,
  FaVideo,
  FaPhoneAlt,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaPlusSquare,
  FaEllipsisV,
  FaRegSmile,
  FaArrowLeft,
} from "react-icons/fa";
import { MdMoreVert, MdOutlineAttachFile, MdSend } from "react-icons/md";
import FileUpload from "./FileUpload";
import MobileUserListToggle from "./MobileUserListToggle";

const ChatRoom = ({ user }) => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [userData, setUserData] = useState({
    username: user?.username || "",
    receivername: "",
    connected: false,
    message: "",
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [publicSubscription, setPublicSubscription] = useState(null);
  const [privateSubscription, setPrivateSubscription] = useState(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUserData((prev) => ({
        ...prev,
        username: user.username,
      }));
    } else {
      setUserData((prev) => ({
        ...prev,
        username: "",
        connected: false,
      }));
    }
  }, [user]);

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

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
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
        break;
      case "MESSAGE":
        setPublicChats((prevPublicChats) => {
          const messageExists = prevPublicChats.some(
            (chat) =>
              chat.message === payloadData.message &&
              chat.senderName === payloadData.senderName
          );
          if (!messageExists) {
            return [...prevPublicChats, payloadData];
          }
          return prevPublicChats;
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
      if (isEcho && payloadData.clientTempId) {
        const optimisticMessageIndex = messages.findIndex(
          (msg) =>
            msg.isOptimistic && msg.clientTempId === payloadData.clientTempId
        );
        if (optimisticMessageIndex !== -1) {
          messages = [
            ...messages.slice(0, optimisticMessageIndex),
            serverMessage,
            ...messages.slice(optimisticMessageIndex + 1),
          ];
        } else {
          const alreadyExists = messages.some(
            (msg) =>
              !msg.isOptimistic &&
              msg.senderName === serverMessage.senderName &&
              msg.receiverName === serverMessage.receiverName &&
              msg.message === serverMessage.message &&
              msg.timestamp === serverMessage.timestamp
          );
          if (!alreadyExists) {
            messages = [...messages, serverMessage];
          }
        }
      } else {
        const alreadyExists = messages.some(
          (msg) =>
            !msg.isOptimistic &&
            msg.senderName === serverMessage.senderName &&
            (isEcho ? msg.receiverName === serverMessage.receiverName : true) &&
            msg.message === serverMessage.message &&
            msg.timestamp === serverMessage.timestamp
        );
        if (!alreadyExists) {
          messages = [...messages, serverMessage];
        }
      }
      newMap.set(chatKey, messages);
      return newMap;
    });
  };

  const onError = (err) => {};

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData((prev) => ({ ...prev, message: value }));
  };
  const sendValue = () => {
    if (stompClient && userData.message.trim() && userData.connected) {
      var chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };
      stompClient.send("/chatroom/public", {}, JSON.stringify(chatMessage));
      setUserData((prev) => ({ ...prev, message: "" }));
    }
  };

  const sendPrivateValue = () => {
    if (stompClient && userData.message.trim() && userData.connected) {
      const clientTimestamp = new Date().toISOString();
      const clientTempId = `client-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        message: userData.message,
        status: "MESSAGE",
        timestamp: clientTimestamp,
        clientTempId: clientTempId,
      };
      setPrivateChats((prevMap) => {
        const newMap = new Map(prevMap);
        const messages = newMap.get(tab) || [];
        newMap.set(tab, [...messages, { ...chatMessage, isOptimistic: true }]);
        return newMap;
      });
      stompClient.send(`/user/${tab}/private`, {}, JSON.stringify(chatMessage));
      setUserData((prev) => ({ ...prev, message: "" }));
    }
  };

  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  const registerUser = () => {
    if (userData.username && !stompClient) {
    }
  };

  const getAvatarUrl = (username) => {
    if (!username) {
      return `https://ui-avatars.com/api/?name=?&background=cccccc&color=fff&size=48`;
    }
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
    const firstLetter = username.charAt(0).toUpperCase();
    const bgColor = stringToColor(username).substring(1);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      firstLetter
    )}&background=${bgColor}&color=fff&size=48&font-size=0.5&bold=true`;
  };

  const [filesData, setFilesData] = useState({
    photos: 115,
    files: 208,
    sharedLinks: 47,
  });
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [isLinksExpanded, setIsLinksExpanded] = useState(true);

  // Close overlay on outside click (mobile)
  useEffect(() => {
    if (!isUserListOpen) return;
    const handleClick = (e) => {
      if (
        e.target.closest(".user-list-overlay") ||
        e.target.closest(".mobile-userlist-toggle")
      ) {
        return;
      }
      setIsUserListOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isUserListOpen]);

  return (
    <div className="layout">
      {/* User List Overlay for mobile */}
      <div
        className={`user-list-overlay${isUserListOpen ? " open" : ""}`}
        style={{ display: isUserListOpen ? "block" : "none" }}
      >
        <div className="user-list-content">
          {/* Render user list here (reuse left column content) */}
          <div className="chat-list-column" style={{ marginTop: "70px" }}>
            <div className="chat-list-header">
              <h2>Ahun chat</h2>
              <FaPlusSquare style={{ cursor: "pointer", fontSize: "1.2rem" }} />
            </div>
            <div className="chat-list-item-container">
              <div
                className={`chat-list-item ${
                  tab === "CHATROOM" ? "active" : ""
                }`}
                onClick={() => setTab("CHATROOM")}
              >
                <img
                  src={getAvatarUrl("Ahun chat")}
                  alt="Ahun Chat"
                  className="chat-list-item-avatar"
                />
                <div className="chat-list-item-content">
                  <p className="chat-list-item-name">Ahun Chat</p>
                  <p
                    className={`chat-list-item-preview ${
                      tab === "CHATROOM" ? "active" : ""
                    }`}
                  >
                    {publicChats.length > 0
                      ? `${publicChats[publicChats.length - 1].senderName}: ${
                          publicChats[publicChats.length - 1].message
                        }`
                      : "Let's discuss this tom..."}
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
      {/* Mobile toggle button in chat header */}
      <MobileUserListToggle
        onClick={() => setIsUserListOpen((v) => !v)}
        isOpen={isUserListOpen}
      />
      <div className="chat-list-column" style={{ marginTop: "70px" }}>
        <div className="chat-list-header">
          <h2>Ahun chat</h2>
          <FaPlusSquare style={{ cursor: "pointer", fontSize: "1.2rem" }} />
        </div>
        <div className="chat-list-item-container">
          <div
            className={`chat-list-item ${tab === "CHATROOM" ? "active" : ""}`}
            onClick={() => setTab("CHATROOM")}
          >
            <img
              src={getAvatarUrl("Ahun chat")}
              alt="Ahun Chat"
              className="chat-list-item-avatar"
            />
            <div className="chat-list-item-content">
              <p className="chat-list-item-name">Ahun Chat</p>
              <p
                className={`chat-list-item-preview ${
                  tab === "CHATROOM" ? "active" : ""
                }`}
              >
                {publicChats.length > 0
                  ? `${publicChats[publicChats.length - 1].senderName}: ${
                      publicChats[publicChats.length - 1].message
                    }`
                  : "Let's discuss this tom..."}
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
      <div className="chat-area-column">
        <div className="chat-header">
          <div className="chat-header-info">
            <img
              src={getAvatarUrl(tab === "CHATROOM" ? "Ahun chat" : tab)}
              alt={tab}
              className="chat-list-item-avatar"
              style={{ width: "40px", height: "40px" }}
            />
            <h2>{tab === "CHATROOM" ? "Ahun Chat" : tab}</h2>
          </div>
          <div className="chat-header-icons">
            <FaPhoneAlt />
            <FaVideo />
            <MdMoreVert />
          </div>
        </div>
        <div className="messages-container">
          {(tab === "CHATROOM" ? publicChats : privateChats.get(tab) || []).map(
            (chat, index) => (
              <React.Fragment key={index}>
                {chat.status === "JOIN" && (
                  <div className="system-message">
                    <FaUsers /> {chat.senderName} joined the chat.
                  </div>
                )}
                {chat.status === "MESSAGE" && (
                  <div
                    className={`message-bubble ${
                      chat.senderName === userData.username ? "self" : ""
                    }`}
                  >
                    {chat.senderName !== userData.username && (
                      <img
                        src={getAvatarUrl(chat.senderName)}
                        alt={chat.senderName}
                        className="message-avatar"
                        style={{ order: 1 }}
                      />
                    )}
                    <div
                      className="message-content"
                      style={{
                        order: chat.senderName === userData.username ? 1 : 2,
                      }}
                    >
                      <p>{chat.message}</p>
                    </div>
                    {chat.senderName === userData.username && (
                      <img
                        src={getAvatarUrl(chat.senderName)}
                        alt={chat.senderName}
                        className="message-avatar"
                        style={{ order: 2 }}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </div>
        <FileUpload
          uploaderId={userData.username}
          onUploadSuccess={(data) => {
            // Show a toast or message in chat when a file is uploaded
            // For now, append a system message to the current chat
            const fileUrl =
              data?.fileUrl || data?.url || data?.downloadUrl || null;
            const fileName =
              data?.fileName || data?.originalName || data?.name || "File";
            let message;
            if (fileUrl) {
              // If it's an image, show a preview, otherwise show a link
              const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl);
              if (isImage) {
                message = `🖼️ <a href='${fileUrl}' target='_blank' rel='noopener noreferrer'>${fileName}</a><br/><img src='${fileUrl}' alt='${fileName}' style='max-width:200px;max-height:150px;margin-top:4px;border-radius:8px;' />`;
              } else {
                message = `📎 <a href='${fileUrl}' target='_blank' rel='noopener noreferrer'>${fileName}</a> uploaded.`;
              }
            } else {
              message = "A file was uploaded.";
            }

            if (tab === "CHATROOM") {
              setPublicChats((prev) => [
                ...prev,
                {
                  senderName: userData.username,
                  message,
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
                    message,
                    status: "MESSAGE",
                    timestamp: new Date().toISOString(),
                    isSystem: true,
                    isFile: true,
                  },
                ]);
                return newMap;
              });
            }
          }}
        />
        <div className="message-input-container">
          <button className="input-icon-button">
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
      </div>
      <div className="info-column">
        <div className="info-header">
          <input
            type="text"
            placeholder="Search"
            className="global-search-input"
          />
          <div className="header-icon-group">
            <FaCog />
            <FaBell />
            <img
              src={getAvatarUrl(userData.username)}
              alt={userData.username}
              className="user-avatar-icon"
            />
          </div>
        </div>
        <div className="action-buttons-bar">
          <button className="action-button active" title="Call">
            <FaPhoneAlt />
          </button>
          <button className="action-button" title="Video Call">
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
    </div>
  );
};

export default ChatRoom;
