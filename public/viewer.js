// viewer.js

const statusEl = document.getElementById("viewerStatus");
const contentEl = document.getElementById("viewerContent");
const textEl = document.getElementById("viewerText");
const fileEl = document.getElementById("viewerFile");
const copyTextBtn = document.getElementById("copyTextBtn");
const downloadBtn = document.getElementById("downloadBtn");

let currentFileMeta = null;

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
    copyTextBtn.style.display = "inline-flex";
  } else {
    textEl.style.display = "none";
    copyTextBtn.style.display = "none";
  }

  // File
  if (paste.file) {
    const file = paste.file;
    currentFileMeta = file;

    // If it's an image/GIF, show it
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = file.url;
      img.alt = file.originalName || "Shared image";
      fileEl.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "viewer-file-meta";

    const link = document.createElement("a");
    link.href = file.url;
    link.textContent = file.originalName || "Download file";
    link.target = "_blank";
    meta.appendChild(link);

    const size = document.createElement("span");
    size.textContent = ` • ${(file.size / 1024).toFixed(1)} KB`;
    meta.appendChild(size);

    fileEl.appendChild(meta);

    downloadBtn.style.display = "inline-flex";
  } else {
    currentFileMeta = null;
    fileEl.style.display = "none";
    downloadBtn.style.display = "none";
  }
}

// Copy only the text content
copyTextBtn.addEventListener("click", async () => {
  const text = textEl.textContent || "";
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    copyTextBtn.textContent = "Copied!";
    setTimeout(() => (copyTextBtn.textContent = "Copy"), 1500);
  } catch {
    copyTextBtn.textContent = "Copy failed";
    setTimeout(() => (copyTextBtn.textContent = "Copy"), 1500);
  }
});

// Download current file
downloadBtn.addEventListener("click", () => {
  if (!currentFileMeta) return;
  const a = document.createElement("a");
  a.href = currentFileMeta.url;
  a.download = currentFileMeta.originalName || "file";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

loadPaste();
