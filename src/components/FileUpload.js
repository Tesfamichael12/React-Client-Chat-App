import React, { useRef, useState } from "react";

const FileUpload = ({ uploaderId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    console.log("[FileUpload] uploaderId prop:", uploaderId, typeof uploaderId);
    if (!uploaderId || isNaN(Number(uploaderId))) {
      alert("User ID is missing or invalid!");
      setUploading(false);
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("uploaderId", uploaderId);
    for (let pair of formData.entries()) {
      console.log("[FileUpload] FormData:", pair[0], pair[1]);
    }
    try {
      const response = await fetch("http://localhost:8080/api/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        alert("Upload failed: " + errText);
        throw new Error("Upload failed: " + errText);
      }
      const data = await response.json();
      if (!data.fileUrl) {
        alert("Upload succeeded but fileUrl missing in response.");
      }
      if (onUploadSuccess) onUploadSuccess(data);
      alert("File uploaded successfully!");
      setSelectedFile(null);
      fileInputRef.current.value = "";
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "1rem 0" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,application/pdf"
        style={{ marginRight: "1rem" }}
      />
      <button onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default FileUpload;
