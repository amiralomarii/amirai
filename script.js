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

// Markdown rendering with code block and libraries support
function renderMarkdown(text) {
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#39;");

  // 1. Extract block code blocks and replace with placeholder
  const codeBlocks = [];
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    codeBlocks.push({ lang: lang || 'code', code: code });
    return `@@CODEBLOCK${codeBlocks.length - 1}@@`;
  });

  // 2. Parse markdown using Marked if available
  let html = text;
  if (window.marked && window.marked.parse) {
    window.marked.setOptions({
      breaks: true,
      gfm: true
    });
    html = window.marked.parse(text);
  } else {
    // Simple fallback rendering
    html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  }

  // 3. Restore code blocks with modern header design
  codeBlocks.forEach((item, idx) => {
    const codeHtml = `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">${item.lang.toUpperCase()}</span>
          <button class="copy-btn">Copy</button>
        </div>
        <pre><code>${escapeHtml(item.code)}</code></pre>
      </div>
    `;
    html = html.replace(`<p>@@CODEBLOCK${idx}@@</p>`, codeHtml);
    html = html.replace(`@@CODEBLOCK${idx}@@`, codeHtml);
  });

  return html;
}

// Function to typeset math formulas in element
function renderMath(element) {
  if (window.renderMathInElement) {
    window.renderMathInElement(element, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    });
  }
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

  // Render math in the appended message
  renderMath(msg);

  return msg;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  messageHistory.push({ role: "user", content: text });

  input.value = "";
  input.style.height = "auto";

  const typingMsg = appendMessage("Assistant is typing...", "bot typing-active");

  // Construct context message containing user's live current date and instructions for proper markdown, math, and table rendering
  const liveDateContext = {
    role: "system",
    content: `You are Amir's unique AI assistant.
1. Today's current date and time is: ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}. Refer to this when answering time or date queries.
2. ALWAYS use LaTeX math formatting for math equations, formulas, and single variables. Wrap block equations in double dollar signs ($$equation$$) and inline equations/variables in single dollar signs ($equation$). For example: use '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$' and '$a^2 + b^2 = c^2$'. Do not write math formulas in plain text or using superscript symbols like ² or ᵐ.
3. ALWAYS format text beautifully with markdown. Use '###' for headings/sections (e.g. '### Algebra'), blockquotes (e.g. '> Quote'), and lists for itemized lines. This is critical for visual styling.
4. ALWAYS format tables using markdown pipe-and-hyphen syntax (e.g. | Column 1 | Column 2 | \\n |---|---| \\n | Row 1 | Row 2 |). Never output tables in plain text, spaces, or tabs.`
  };

  fetch("https://amirai.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [liveDateContext, ...messageHistory] }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      typingMsg.classList.remove("typing-active");
      if (typingMsg.parentElement) {
        typingMsg.parentElement.classList.remove("typing-active");
      }
      if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content;
        typingMsg.innerHTML = renderMarkdown(reply);
        renderMath(typingMsg);
        messageHistory.push({ role: "assistant", content: reply });
      } else if (data.error) {
        typingMsg.textContent = `Error: ${data.error}`;
      } else {
        typingMsg.textContent = "Sorry, I couldn't get a response.";
      }
    })
    .catch((err) => {
      typingMsg.classList.remove("typing-active");
      if (typingMsg.parentElement) {
        typingMsg.parentElement.classList.remove("typing-active");
      }
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
  
  // Find code block within the same wrapper wrapper
  const wrapper = e.target.closest(".code-block-wrapper");
  const codeElement = wrapper ? wrapper.querySelector("code") : null;
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
