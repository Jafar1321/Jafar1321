/* ===== MGIT Chatbot Prototype — script.js (robust loader + matching) ===== */

let faqData = [];

// Load FAQs once on startup (supports both [{...}] and { faq: [...] })
fetch("faq.json")
  .then((res) => res.json())
  .then((data) => {
    faqData = Array.isArray(data) ? data : (Array.isArray(data.faq) ? data.faq : []);
    if (!faqData.length) {
      addBotMessage("⚠️ FAQs are empty. Please check faq.json format/content.");
    }
  })
  .catch((err) => {
    console.error("Failed to load FAQ JSON:", err);
    addBotMessage("⚠️ Unable to load FAQs. Please check faq.json.");
  });

const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

// Utilities
const normalize = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, ""); // strip punctuation (unicode-aware)

// UI helpers
function addMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-message" : "bot-message";
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
const addBotMessage = (t) => addMessage(t, "bot");

// Handle submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = userInput.value.trim();
  if (!query) return;

  addMessage(query, "user");
  userInput.value = "";
  processQuery(query);
});

// Matching pipeline: exact → partial → keyword
function processQuery(query) {
  if (!faqData || !faqData.length) {
    addBotMessage("⚠️ FAQs not loaded yet. Please try again in a moment.");
    return;
  }

  const cleaned = normalize(query);

  // 1) Exact match on normalized question
  const exact = faqData.find(
    (item) => normalize(item.question || "") === cleaned
  );
  if (exact) return addBotMessage(exact.answer);

  // 2) Partial match (substring in question)
  const partial = faqData.find((item) =>
    normalize(item.question || "").includes(cleaned)
  );
  if (partial) return addBotMessage(partial.answer);

  // 3) Keyword match (if keywords array is present)
  const tokens = new Set(cleaned.split(" ").filter(Boolean));
  const byKeyword = faqData.find((item) => {
    const kws = Array.isArray(item.keywords) ? item.keywords : [];
    return kws.some((kw) => tokens.has(normalize(kw)));
  });
  if (byKeyword) return addBotMessage(byKeyword.answer);

  // Fallback
  addBotMessage(
    "Sorry, I don’t have an answer for that yet. Please contact the college for more details."
  );
}
