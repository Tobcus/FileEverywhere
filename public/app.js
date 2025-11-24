// app.js

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const textInput = document.getElementById("textInput");
const previewArea = document.getElementById("previewArea");
const createBtn = document.getElementById("createBtn");
const statusEl = document.getElementById("status");
const linkBox = document.getElementById("linkBox");
const shareLinkInput = document.getElementById("shareLink");
const copyLinkBtn = document.getElementById("copyLinkBtn");

let currentFile = null;

function setStatus(msg, kind = "info") {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", kind === "error");
}

function resetPreview() {
  previewArea.innerHTML =
    '<p class="muted">No content yet. Paste text or an image to preview.</p>';
  previewArea.classList.add("empty");
}

function showTextPreview(text) {
  previewArea.classList.remove("empty");
  previewArea.innerHTML = "";
  const pre = document.createElement("pre");
  pre.textContent = text.slice(0, 5000);
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontFamily = "system-ui, -apple-system, sans-serif";
  pre.style.fontSize = "13px";
  previewArea.appendChild(pre);
}

function showImagePreview(file) {
  previewArea.classList.remove("empty");
  previewArea.innerHTML = "";
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  previewArea.appendChild(img);

  const meta = document.createElement("div");
  meta.className = "preview-file-meta";
  meta.textContent = `${file.name || "clipboard-image"} • ${Math.round(
    file.size / 1024
  )} KB`;
  previewArea.appendChild(meta);
}

function showFilePreview(file) {
  previewArea.classList.remove("empty");
  previewArea.innerHTML = "";
  const icon = document.createElement("div");
  icon.textContent = "📄";
  icon.style.fontSize = "32px";
  previewArea.appendChild(icon);

  const meta = document.createElement("div");
  meta.className = "preview-file-meta";
  meta.textContent = `${file.name} • ${file.type || "file"} • ${Math.round(
    file.size / 1024
  )} KB`;
  previewArea.appendChild(meta);
}

// Handle regular file input
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentFile = file;

  if (file.type.startsWith("image/")) {
    showImagePreview(file);
  } else {
    showFilePreview(file);
  }

  setStatus(`Attached file: ${file.name}`);
});

// Drag & drop support
["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.borderColor = "#7c3aed";
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.style.borderColor = "rgba(148,163,184,0.7)";
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  currentFile = file;
  if (file.type.startsWith("image/")) {
    showImagePreview(file);
  } else {
    showFilePreview(file);
  }
  setStatus(`Dropped file: ${file.name}`);
});

// Clipboard paste: images or text
document.addEventListener("paste", (event) => {
  const items = (event.clipboardData || event.originalEvent?.clipboardData)
    ?.items;
  if (!items || !items.length) return;

  // Try image first
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) {
        currentFile = file;
        showImagePreview(file);
        setStatus("Image pasted from clipboard");
        return;
      }
    }
  }

  // Then look for plain text
  const text = (event.clipboardData || event.originalEvent?.clipboardData)
    ?.getData("text");
  if (text) {
    textInput.value = text;
    showTextPreview(text);
    setStatus("Text pasted from clipboard");
  }
});

// Live text preview
textInput.addEventListener("input", () => {
  const text = textInput.value.trim();
  if (!text && !currentFile) {
    resetPreview();
    return;
  }
  if (text) {
    showTextPreview(text);
  } else if (currentFile) {
    if (currentFile.type.startsWith("image/")) {
      showImagePreview(currentFile);
    } else {
      showFilePreview(currentFile);
    }
  }
});

// Create share link
createBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();

  if (!text && !currentFile) {
    setStatus("Please paste text or attach a file first", "error");
    return;
  }

  setStatus("Uploading...");
  linkBox.classList.add("hidden");

  const formData = new FormData();
  if (text) formData.append("text", text);
  if (currentFile) formData.append("file", currentFile);

  try {
    const res = await fetch("/api/paste", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    const absoluteUrl = `${window.location.origin}${data.url}`;
    shareLinkInput.value = absoluteUrl;
    linkBox.classList.remove("hidden");
    setStatus("Link generated");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Something went wrong", "error");
  }
});

// Copy link to clipboard
copyLinkBtn.addEventListener("click", async () => {
  const url = shareLinkInput.value;
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    setStatus("Link copied to clipboard");
  } catch {
    setStatus("Unable to copy link automatically", "error");
  }
});

// Initialize
resetPreview();