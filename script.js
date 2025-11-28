const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
let messageHistory = [];

// Silent warm-up: sends a dummy message so first real message is fast
window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("⚡ Warm-up started");
    const res = await fetch("https://amirai.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] })
    });
    const data = await res.json();
    console.log("✅ Warm-up finished:", data);
  } catch (err) {
    console.error("⚠️ Warm-up failed:", err);
  }
});

// Markdown rendering with code block support
function renderMarkdown(text) {
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#39;");

  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
    codeBlocks.push(p1);
    return `@@CODEBLOCK${codeBlocks.length - 1}@@`;
  });

  let escaped = escapeHtml(text);
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  escaped = escaped.replace(/\*(.*?)\*/g, '<i>$1</i>');

  codeBlocks.forEach((code, idx) => {
    const codeHtml = `
      <div class="code-block-wrapper">
        <pre><code>${escapeHtml(code)}</code></pre>
        <button class="copy-btn">Copy</button>
      </div>
    `;
    escaped = escaped.replace(`@@CODEBLOCK${idx}@@`, codeHtml);
  });

  return escaped;
}

function appendMessage(content, sender) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-wrapper ${sender}`;

  const label = document.createElement("div");
  label.className = "chat-label";
  label.textContent = sender === "user" ? "You" : "Amir's AI Assistant";

  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = renderMarkdown(content);

  wrapper.appendChild(label);
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  return msg;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  messageHistory.push({ role: "user", content: text });

  input.value = "";
  input.style.height = "auto";

  const typingMsg = appendMessage("Assistant is typing...", "bot");

  fetch("https://amirai.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messageHistory }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content;
        typingMsg.innerHTML = renderMarkdown(reply);
        messageHistory.push({ role: "assistant", content: reply });
      } else if (data.error) {
        typingMsg.textContent = `Error: ${data.error}`;
      } else {
        typingMsg.textContent = "Sorry, I couldn't get a response.";
      }
    })
    .catch((err) => {
      typingMsg.textContent = "⚠️ Error: " + err.message;
    });
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

// Copy button event listener
chatBox.addEventListener("click", (e) => {
  if (!e.target.classList.contains("copy-btn")) return;
  const codeElement = e.target.previousElementSibling.querySelector("code");
  if (!codeElement) return;

  const textToCopy = codeElement.textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      e.target.textContent = "Copied!";
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => { e.target.textContent = "Copy"; }, 2000);
    }).catch(() => fallbackCopy(textToCopy, e.target));
  } else fallbackCopy(textToCopy, e.target);
});

function fallbackCopy(text, btn) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      btn.textContent = "Copied!";
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => { btn.textContent = "Copy"; }, 2000);
    } else alert("Copy failed, please copy manually.");
  } catch {
    alert("Copy failed, please copy manually.");
  }

  document.body.removeChild(textarea);
}
