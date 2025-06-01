import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import styled, { useTheme } from "styled-components";
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

const Layout = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
`;

const Column = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${(props) => props.theme.border || "#3e444c"};
  &:last-child {
    border-right: none;
  }
`;

const ChatListColumn = styled(Column)`
  width: 25%;
  min-width: 280px;
  background-color: ${(props) =>
    props.theme.bgLighter || props.theme.card || "#212529"};
`;

const ChatAreaColumn = styled(Column)`
  width: 50%;
  flex-grow: 1;
  background-color: ${(props) => props.theme.background};
`;

const InfoColumn = styled(Column)`
  width: 25%;
  min-width: 280px;
  background-color: ${(props) =>
    props.theme.bgLighter || props.theme.card || "#212529"};
`;

const SmallAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
`;

const UserInfo = styled.div`
  p {
    margin: 0;
    font-weight: 600;
    font-size: 1rem;
    color: ${(props) => props.theme.text};
  }
  span {
    font-size: 0.8rem;
    color: ${(props) => props.theme.textSecondary || props.theme.text};
  }
`;

const ChatListHeader = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.border || "#3e444c"};
  h2 {
    margin: 0;
    font-size: 1.2rem;
    color: ${(props) => props.theme.primary};
  }
`;

const ChatSearchInput = styled.input`
  width: calc(100% - 40px);
  padding: 10px 15px;
  margin: 10px 20px;
  border-radius: 20px;
  border: 1px solid ${(props) => props.theme.border || "#3e444c"};
  background-color: ${(props) =>
    props.theme.inputBg || props.theme.card || "#2c3035"};
  color: ${(props) => props.theme.text};
  font-size: 0.9rem;
  outline: none;
  &::placeholder {
    color: ${(props) => props.theme.textSecondary || props.theme.text};
  }
`;

const ChatListItemContainer = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${(props) =>
      props.theme.scrollbarTrack || props.theme.primary || "#212529"};
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) =>
      props.theme.scrollbarThumb || props.theme.primary || "#495057"};
    border-radius: 3px;
  }
`;

const ChatListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid ${(props) => props.theme.border || "#3e444c"};
  background-color: ${(props) =>
    props.active ? props.theme.activeBg || props.theme.primary : "transparent"};
  &:hover {
    background-color: ${(props) =>
      props.theme.hoverBg || props.theme.secondary || "#343a40"};
  }
`;

const ChatListItemAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
`;

const ChatListItemContent = styled.div`
  flex-grow: 1;
  overflow: hidden;
`;

const ChatListItemName = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(props) => props.theme.text};
`;

const ChatListItemPreview = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${(props) =>
    props.active
      ? props.theme.text
      : props.theme.textSecondary || props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatHeader = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.border || "#3e444c"};
  background-color: ${(props) =>
    props.theme.bgLighter || props.theme.card || "#212529"};
`;

const ChatHeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: ${(props) => props.theme.text};
  }
`;

const ChatHeaderIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 1.2rem;
  color: ${(props) =>
    props.theme.iconColor || props.theme.textSecondary || "#adb5bd"};
  svg {
    cursor: pointer;
    &:hover {
      color: ${(props) =>
        props.theme.iconHoverColor || props.theme.primary || "#e9ecef"};
    }
  }
`;

const MessagesContainer = styled.div`
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${(props) =>
      props.theme.scrollbarTrack || props.theme.card || "#212529"};
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) =>
      props.theme.scrollbarThumb || props.theme.primary || "#495057"};
    border-radius: 4px;
  }
`;

const DateSeparator = styled.div`
  text-align: center;
  margin: 15px 0;
  span {
    background-color: ${(props) =>
      props.theme.activeBg || props.theme.secondary || "#495057"};
    color: ${(props) => props.theme.textSecondary || props.theme.text};
    padding: 5px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
  }
`;

const MessageBubble = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  max-width: 70%;
  margin-bottom: 5px;
  align-self: ${(props) => (props.$self ? "flex-end" : "flex-start")};
`;

const MessageAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin: ${(props) => (props.$self ? "0 0 0 10px" : "0 10px 0 0")};
  order: ${(props) => (props.$self ? 2 : 1)};
`;

const MessageContent = styled.div`
  background-color: ${(props) =>
    props.$self
      ? props.theme.selfMessageBg || props.theme.primary || "#30343a"
      : props.theme.otherMessageBg || props.theme.card || "#262a2e"};
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 0.9rem;
  order: ${(props) => (props.$self ? 1 : 2)};
  p {
    margin: 0 0 5px 0;
    word-wrap: break-word;
    color: ${(props) => props.theme.text};
  }
  span {
    font-size: 0.7rem;
    color: ${(props) => props.theme.textSecondary || props.theme.text};
    display: block;
    text-align: right;
  }
`;

const SystemMessage = styled.div`
  align-self: center;
  background-color: ${(props) =>
    props.theme.systemMessageBg || "rgba(0,0,0,0.2)"};
  color: ${(props) => props.theme.textSecondary || props.theme.text};
  padding: 8px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MessageInputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid ${(props) => props.theme.border || "#3e444c"};
  background-color: ${(props) =>
    props.theme.bgLighter || props.theme.card || "#212529"};
`;

const MessageInput = styled.input`
  flex-grow: 1;
  padding: 12px 15px;
  border-radius: 20px;
  border: none;
  background-color: ${(props) =>
    props.theme.inputBg || props.theme.background || "#2c3035"};
  color: ${(props) => props.theme.text};
  font-size: 0.9rem;
  margin: 0 10px;
  outline: none;
  &::placeholder {
    color: ${(props) => props.theme.textSecondary || props.theme.text};
  }
`;

const InputIconButton = styled.button`
  background: none;
  border: none;
  color: ${(props) =>
    props.theme.iconColor || props.theme.textSecondary || "#adb5bd"};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: ${(props) =>
      props.theme.iconHoverColor || props.theme.primary || "#e9ecef"};
  }
`;

const InfoHeader = styled.div`
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${(props) => props.theme.border || "#3e444c"};
`;

const GlobalSearchInput = styled.input`
  flex-grow: 1;
  padding: 8px 12px;
  border-radius: 15px;
  border: 1px solid ${(props) => props.theme.border || "#3e444c"};
  background-color: ${(props) =>
    props.theme.inputBg || props.theme.card || "#2c3035"};
  color: ${(props) => props.theme.text};
  font-size: 0.85rem;
  margin-right: 15px;
  outline: none;
  &::placeholder {
    color: ${(props) => props.theme.textSecondary || props.theme.text};
  }
`;

const HeaderIconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.2rem;
  color: ${(props) =>
    props.theme.iconColor || props.theme.textSecondary || "#adb5bd"};
  svg {
    cursor: pointer;
    &:hover {
      color: ${(props) =>
        props.theme.iconHoverColor || props.theme.primary || "#e9ecef"};
    }
  }
`;

const UserAvatarIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
`;

const ActionButtonsBar = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 15px 10px;
  border-bottom: 1px solid ${(props) => props.theme.border || "#3e444c"};
`;

const ActionButton = styled.button`
  background-color: ${(props) =>
    props.active ? props.theme.primary : "transparent"};
  color: ${(props) =>
    props.active
      ? props.theme.text
      : props.theme.iconColor || props.theme.textSecondary};
  border: 1px solid
    ${(props) =>
      props.active ? props.theme.primary : props.theme.border || "#3e444c"};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${(props) =>
      props.active
        ? props.theme.primaryLight || props.theme.secondary
        : props.theme.hoverBg || props.theme.card};
    border-color: ${(props) =>
      props.active
        ? props.theme.primaryLight || props.theme.secondary
        : props.theme.hoverBg || props.theme.card};
    color: ${(props) =>
      props.theme.iconHoverColor || props.theme.primary || "#e9ecef"};
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  color: ${(props) => props.theme.textSecondary || props.theme.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 20px 20px 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  svg {
    font-size: 0.8rem;
  }
`;

const MemberList = styled.div`
  overflow-y: auto;
  padding: 0 10px 0 20px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${(props) =>
      props.theme.scrollbarTrack || props.theme.primary || "#212529"};
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) =>
      props.theme.scrollbarThumb || props.theme.primary || "#495057"};
    border-radius: 3px;
  }
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: ${(props) =>
      props.theme.hoverBg || props.theme.card || "#343a40"};
  }
`;

const MemberAvatar = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  margin-right: 12px;
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const OnlineIndicator = styled.span`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: ${(props) => props.theme.onlineIndicator || "#4caf50"};
  border-radius: 50%;
  border: 2px solid
    ${(props) => props.theme.bgLighter || props.theme.card || "#212529"};
`;

const MemberName = styled.p`
  margin: 0;
  font-size: 0.9rem;
  flex-grow: 1;
  color: ${(props) => props.theme.text};
`;

const AdminBadge = styled.span`
  background-color: ${(props) => props.theme.adminBadgeBg || "#c0392b"};
  color: ${(props) => props.theme.adminBadgeText || "#ffffff"};
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
`;

const FilesSection = styled.div`
  padding: 0 20px 20px 20px;
  border-top: 1px solid ${(props) => props.theme.border || "#3e444c"};
  margin-top: 15px;
`;

const FileCategory = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-size: 0.9rem;
  cursor: pointer;
  color: ${(props) => props.theme.textSecondary || props.theme.text};
  &:hover {
    color: ${(props) => props.theme.text};
  }
  svg:first-child {
    margin-right: 10px;
    font-size: 1.1rem;
    color: ${(props) => props.theme.primary};
  }
  span {
    flex-grow: 1;
  }
  svg:last-child {
    font-size: 0.8rem;
  }
`;

const ChatRoom = ({ user }) => {
  const theme = useTheme();
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

  return (
    <Layout>
      <ChatListColumn style={{ marginTop: "70px", fontSize: "1.2rem" }}>
        <ChatListHeader>
          <h2>Ahun chat</h2>
          <FaPlusSquare style={{ cursor: "pointer", fontSize: "1.2rem" }} />
        </ChatListHeader>
        <ChatListItemContainer>
          <ChatListItem
            active={tab === "CHATROOM"}
            onClick={() => setTab("CHATROOM")}
          >
            <ChatListItemAvatar
              src={getAvatarUrl("Ahun chat")}
              alt="Ahun Chat"
            />
            <ChatListItemContent>
              <ChatListItemName>Ahun Chat</ChatListItemName>
              <ChatListItemPreview active={tab === "CHATROOM"}>
                {publicChats.length > 0
                  ? `${publicChats[publicChats.length - 1].senderName}: ${
                      publicChats[publicChats.length - 1].message
                    }`
                  : "Let's discuss this tom..."}
              </ChatListItemPreview>
            </ChatListItemContent>
          </ChatListItem>
          {[...privateChats.keys()].map((name, index) => (
            <ChatListItem
              key={index}
              active={tab === name}
              onClick={() => setTab(name)}
            >
              <ChatListItemAvatar src={getAvatarUrl(name)} alt={name} />
              <ChatListItemContent>
                <ChatListItemName>{name}</ChatListItemName>
                <ChatListItemPreview active={tab === name}>
                  {privateChats.get(name) && privateChats.get(name).length > 0
                    ? `${privateChats
                        .get(name)
                        [privateChats.get(name).length - 1].message.substring(
                          0,
                          30
                        )}...`
                    : "No messages yet"}
                </ChatListItemPreview>
              </ChatListItemContent>
            </ChatListItem>
          ))}
        </ChatListItemContainer>
      </ChatListColumn>
      <ChatAreaColumn>
        <ChatHeader>
          <ChatHeaderInfo>
            <ChatListItemAvatar
              src={getAvatarUrl(tab === "CHATROOM" ? "Ahun chat" : tab)}
              alt={tab}
              style={{ width: "40px", height: "40px" }}
            />
            <h2>{tab === "CHATROOM" ? "Ahun Chat" : tab}</h2>
          </ChatHeaderInfo>
          <ChatHeaderIcons>
            <FaPhoneAlt />
            <FaVideo />
            <MdMoreVert />
          </ChatHeaderIcons>
        </ChatHeader>
        <MessagesContainer>
          {(tab === "CHATROOM" ? publicChats : privateChats.get(tab) || []).map(
            (chat, index) => (
              <React.Fragment key={index}>
                {chat.status === "JOIN" && (
                  <SystemMessage>
                    <FaUsers /> {chat.senderName} joined the chat.
                  </SystemMessage>
                )}
                {chat.status === "MESSAGE" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems:
                        chat.senderName === userData.username
                          ? "flex-end"
                          : "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: theme.textSecondary || "#6c757d",
                        marginBottom: "6px",
                        paddingLeft:
                          chat.senderName !== userData.username ? "46px" : "0",
                        paddingRight:
                          chat.senderName === userData.username ? "46px" : "0",
                        textAlign:
                          chat.senderName === userData.username
                            ? "right"
                            : "left",
                        width: "100%",
                        lineHeight: "1.2",
                      }}
                    >
                      {chat.senderName}
                      <span style={{ marginLeft: "8px" }}>
                        {new Date(
                          chat.timestamp || Date.now()
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <MessageBubble
                      $self={chat.senderName === userData.username}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {chat.senderName !== userData.username && (
                        <MessageAvatar
                          src={getAvatarUrl(chat.senderName)}
                          alt={chat.senderName}
                          $self={false}
                        />
                      )}
                      <MessageContent
                        $self={chat.senderName === userData.username}
                      >
                        <p>{chat.message}</p>
                      </MessageContent>
                      {chat.senderName === userData.username && (
                        <MessageAvatar
                          src={getAvatarUrl(chat.senderName)}
                          alt={chat.senderName}
                        />
                      )}
                    </MessageBubble>
                    {chat.senderName === userData.username && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: theme.textMuted || "#adb5bd",
                          marginTop: "6px",
                          paddingLeft:
                            chat.senderName !== userData.username
                              ? "46px"
                              : "0",
                          paddingRight:
                            chat.senderName === userData.username
                              ? "46px"
                              : "0",
                          textAlign:
                            chat.senderName === userData.username
                              ? "right"
                              : "left",
                          width: "100%",
                          lineHeight: "1.2",
                        }}
                      >
                        {`Seen at ${new Date(
                          chat.seenTimestamp || Date.now()
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </MessagesContainer>
        <MessageInputContainer>
          <InputIconButton>
            <MdOutlineAttachFile />
          </InputIconButton>
          <MessageInput
            type="text"
            placeholder="Write a message..."
            value={userData.message}
            onChange={handleMessage}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                tab === "CHATROOM" ? sendValue() : sendPrivateValue();
              }
            }}
          />
          <InputIconButton
            onClick={tab === "CHATROOM" ? sendValue : sendPrivateValue}
          >
            <MdSend />
          </InputIconButton>
        </MessageInputContainer>
      </ChatAreaColumn>
      <InfoColumn>
        <InfoHeader>
          <GlobalSearchInput placeholder="Search" />
          <HeaderIconGroup>
            <FaCog />
            <FaBell />
            <UserAvatarIcon
              src={getAvatarUrl(userData.username)}
              alt={userData.username}
            />
          </HeaderIconGroup>
        </InfoHeader>
        <ActionButtonsBar>
          <ActionButton active={true} title="Call">
            <FaPhoneAlt />
          </ActionButton>
          <ActionButton title="Video Call">
            <FaVideo />
          </ActionButton>
          <ActionButton title="Add Members">
            <FaUsers />
          </ActionButton>
          <ActionButton title="More Options">
            <MdMoreVert />
          </ActionButton>
        </ActionButtonsBar>
        <SectionTitle>Online Users</SectionTitle>
        <MemberList>
          <MemberItem onClick={() => {}}>
            <MemberAvatar>
              <img
                src={getAvatarUrl(userData.username)}
                alt={userData.username}
              />
              <OnlineIndicator />
            </MemberAvatar>
            <MemberName>You</MemberName>
          </MemberItem>
          {onlineUsers
            .filter((name) => name !== userData.username)
            .map((name) => {
              return (
                <MemberItem
                  key={name}
                  onClick={() => setTab(name)}
                  title={`Chat with ${name}`}
                >
                  <MemberAvatar>
                    <img src={getAvatarUrl(name)} alt={name} />
                    <OnlineIndicator />
                  </MemberAvatar>
                  <MemberName>{name}</MemberName>
                </MemberItem>
              );
            })}
        </MemberList>
        <FilesSection>
          <SectionTitle
            onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
            style={{ cursor: "pointer" }}
          >
            Files
            {isPhotosExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </SectionTitle>
          {isPhotosExpanded && (
            <>
              <FileCategory onClick={() => {}}>
                <FaPlusSquare />
                <span>{filesData.photos} photos</span>
                <FaChevronDown />
              </FileCategory>
              <FileCategory onClick={() => {}}>
                <FaPaperclip />
                <span>{filesData.files} files</span>
                <FaChevronDown />
              </FileCategory>
              <FileCategory onClick={() => {}}>
                <FaTelegramPlane />
                <span>{filesData.sharedLinks} shared links</span>
                <FaChevronDown />
              </FileCategory>
            </>
          )}
        </FilesSection>
      </InfoColumn>
    </Layout>
  );
};

export default ChatRoom;
