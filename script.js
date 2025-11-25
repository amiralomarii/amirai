const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let messageHistory = [];

// Markdown rendering with code block support
function renderMarkdown(text) {
  // Escape HTML special chars to prevent XSS (except inside code blocks)
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#39;");

  // Replace code blocks ```code```
  // We'll temporarily replace them with a unique placeholder so we don't escape their content
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
    codeBlocks.push(p1);
    return `@@CODEBLOCK${codeBlocks.length - 1}@@`;
  });

  // Escape the rest of the text
  let escaped = escapeHtml(text);

  // Replace **bold** with <b>bold</b>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Replace *italic* with <i>italic</i>
  escaped = escaped.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Now replace placeholders with actual code blocks with copy button
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

  return msg; // to update the typing message later
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
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
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

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

// Copy button event listener for code blocks with mobile support and vibration feedback
chatBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("copy-btn")) {
    const codeElement = e.target.previousElementSibling.querySelector("code");
    if (!codeElement) return;

    const textToCopy = codeElement.textContent;

    // Try modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        e.target.textContent = "Copied!";
        if (navigator.vibrate) {
          navigator.vibrate(100); // Vibrate for 100ms on mobile
        }
        setTimeout(() => {
          e.target.textContent = "Copy";
        }, 2000);
      }).catch(() => fallbackCopy(textToCopy, e.target));
    } else {
      // Fallback for older browsers
      fallbackCopy(textToCopy, e.target);
    }
  }
});

// Fallback copy function using textarea + execCommand
function fallbackCopy(text, btn) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";  // prevent scrolling
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      btn.textContent = "Copied!";
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        btn.textContent = "Copy";
      }, 2000);
    } else {
      alert("Copy failed, please copy manually.");
    }
  } catch (err) {
    alert("Copy failed, please copy manually.");
  }

  document.body.removeChild(textarea);
}
