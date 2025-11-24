// viewer.js

const statusEl = document.getElementById("viewerStatus");
const contentEl = document.getElementById("viewerContent");
const textEl = document.getElementById("viewerText");
const fileEl = document.getElementById("viewerFile");

function getIdFromPath() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

async function loadPaste() {
  const id = getIdFromPath();
  statusEl.textContent = "Loading...";

  try {
    const res = await fetch(`/api/paste/${id}`);
    if (!res.ok) {
      throw new Error("Paste not found");
    }
    const data = await res.json();
    renderPaste(data);
  } catch (err) {
    statusEl.textContent = err.message || "Error loading paste";
  }
}

function renderPaste(paste) {
  statusEl.textContent = "";
  contentEl.classList.remove("hidden");

  // Text
  if (paste.text) {
    textEl.textContent = paste.text;
  } else {
    textEl.style.display = "none";
  }

  // File
  if (paste.file) {
    const file = paste.file;
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = file.url;
      fileEl.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "viewer-file-meta";
    const link = document.createElement("a");
    link.href = file.url;
    link.textContent = `Download ${file.originalName}`;
    link.target = "_blank";
    meta.appendChild(link);

    const size = document.createElement("span");
    size.textContent = ` • ${(file.size / 1024).toFixed(1)} KB`;
    meta.appendChild(size);

    fileEl.appendChild(meta);
  } else {
    fileEl.style.display = "none";
  }
}

loadPaste();
