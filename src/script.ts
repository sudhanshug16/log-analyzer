import { analyzeLogs } from "./analysis.ts";
import { bytesInfo } from "./util.ts";
import { encryptApiKey, decryptApiKey } from "./encryption.ts";
import type { EncData } from "./encryption.ts";
import {
  MAX_SIZE_BYTES,
  DEFAULT_MODEL,
  DEFAULT_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  DEFAULT_MAX_CHUNK_SIZE,
} from "./constants.ts";
import {
  hostInput,
  apiKeyInput,
  saveKeyChk,
  savePlainChk,
  passphraseGroup,
  passphraseInput,
  passHintInput,
  hintDisplay,
  clearKeyBtn,
  keyStatus,
  modelInput,
  chunkInput,
  chunkSlider,
  maxChunkInput,
  logsInput,
  fileInput,
  logSizeInfo,
  analyzeBtn,
  clearLogsBtn,
  progressBar,
  progressBarInner,
  resultOutput,
  instrInput,
  toggleHistoryBtn,
  historyOutput,
} from "./dom.ts";
import { syncChunkInputs, updateKeyStatus } from "./ui.ts";

// ---------- helpers ----------
function appendHistory(inc: string) {
  const addMsg = (role: "user" | "assist", txt: string) => {
    const wrap = document.createElement("div");
    wrap.className = `history-message ${role}`;
    const bubble = document.createElement("pre");
    bubble.className = "history-bubble";
    bubble.textContent = txt.trim();
    wrap.appendChild(bubble);
    historyOutput.appendChild(wrap);
    historyOutput.scrollTop = historyOutput.scrollHeight;
  };

  let current: "user" | "assist" | null = null;
  let buf = "";
  inc
    .trim()
    .split(/\n/)
    .forEach((ln) => {
      if (ln.startsWith("USER")) {
        if (buf) addMsg(current!, buf);
        current = "user";
        buf = "";
      } else if (ln.startsWith("ASSISTANT")) {
        if (buf) addMsg(current!, buf);
        current = "assist";
        buf = "";
      } else {
        buf += (buf ? "\n" : "") + ln;
      }
    });
  if (current && buf) addMsg(current, buf);
}

// ---------------- DOM ------------------
// (DOM element declarations moved to dom.ts)

// ---------------- Event bindings ------------------
// init values
hostInput.value =
  localStorage.getItem("host") || "https://openrouter.ai/api/v1";
modelInput.value = localStorage.getItem("model") || DEFAULT_MODEL;
chunkInput.value =
  localStorage.getItem("chunk") || DEFAULT_CHUNK_SIZE.toString();
maxChunkInput.value =
  localStorage.getItem("maxChunk") || DEFAULT_MAX_CHUNK_SIZE.toString();
updateKeyStatus();

// ----- API key storage state -----
let storedEnc = localStorage.getItem("encApiKey");
let storedPlain = localStorage.getItem("plainApiKey");
let decryptedApiKey: string | null = null;

// Initial UI based on stored keys
if (storedEnc) {
  // ----- Encrypted key flow -----
  passphraseGroup.style.display = "block";
  saveKeyChk.checked = true;
  savePlainChk.checked = false;

  const storedHint = localStorage.getItem("encHint") || "";
  if (storedHint) {
    hintDisplay.textContent = `Hint: ${storedHint}`;
    hintDisplay.style.display = "block";
  }

  passHintInput.style.display = "none";

  passphraseInput.addEventListener("input", async () => {
    const pass = passphraseInput.value;
    const latest = localStorage.getItem("encApiKey");
    if (!latest) return;
    const encData: EncData = JSON.parse(latest);
    const plain = await decryptApiKey(encData, pass);
    if (plain !== null) {
      decryptedApiKey = plain;
      apiKeyInput.value = plain;
      apiKeyInput.disabled = false;
      passphraseInput.style.borderColor = "green";
      keyStatus.textContent = "Key decrypted.";
    } else {
      apiKeyInput.value = "";
      apiKeyInput.disabled = true;
      passphraseInput.style.borderColor = "";
      keyStatus.textContent = "Enter passphrase to decrypt.";
    }
  });

  apiKeyInput.disabled = true;
} else if (storedPlain) {
  // ----- Plain key flow -----
  apiKeyInput.value = storedPlain;
  apiKeyInput.disabled = false;
  savePlainChk.checked = true;
  saveKeyChk.checked = false;
  passphraseGroup.style.display = "none";
  passHintInput.style.display = "none";
  hintDisplay.style.display = "none";
} else {
  // ----- No key stored -----
  passphraseGroup.style.display = "none";
  apiKeyInput.disabled = false;
  passHintInput.style.display = "inline-block";
  hintDisplay.style.display = "none";
}

// Checkbox toggle behavior
saveKeyChk.addEventListener("change", () => {
  if (saveKeyChk.checked) {
    // Ensure only one save mode at a time
    savePlainChk.checked = false;
    passphraseGroup.style.display = "block";
    if (!storedEnc) {
      passHintInput.style.display = "inline-block";
    }
  } else {
    passphraseGroup.style.display = "none";
  }
});

// Plain save toggle
savePlainChk.addEventListener("change", () => {
  if (savePlainChk.checked) {
    saveKeyChk.checked = false;
    passphraseGroup.style.display = "none";
  }
});

// clear stored key
clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem("encApiKey");
  localStorage.removeItem("encHint");
  localStorage.removeItem("plainApiKey");
  apiKeyInput.value = "";
  apiKeyInput.disabled = false;
  passphraseInput.value = "";
  passHintInput.value = "";
  saveKeyChk.checked = false;
  savePlainChk.checked = false;
  passphraseGroup.style.display = "none";
  hintDisplay.style.display = "none";
  updateKeyStatus();
});

modelInput.addEventListener("change", () => {
  localStorage.setItem("model", modelInput.value.trim());
});
hostInput.addEventListener("change", () => {
  localStorage.setItem("host", hostInput.value.trim());
});

logsInput.addEventListener("input", () => {
  const bytes = new TextEncoder().encode(logsInput.value).length;
  logSizeInfo.textContent = bytesInfo(bytes);
  if (bytes > MAX_SIZE_BYTES) {
    alert("Logs exceed 5 MB. Please upload a file instead.");
    logsInput.value = "";
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) {
    if (file.size > MAX_SIZE_BYTES) {
      alert("File exceeds 5 MB limit");
      fileInput.value = "";
      return;
    }
    logSizeInfo.textContent = bytesInfo(file.size);
  }
});

// Clear logs button
clearLogsBtn.addEventListener("click", () => {
  logsInput.value = "";
  logSizeInfo.textContent = "";
  fileInput.value = "";
});

// --- Token slider syncing ---
chunkSlider.addEventListener("input", () => syncChunkInputs("slider"));
chunkInput.addEventListener("change", () => syncChunkInputs("number"));

// init slider value
chunkSlider.min = MIN_CHUNK_SIZE.toString();
chunkSlider.max = maxChunkInput.value;
chunkSlider.step = "1000";
chunkSlider.value = chunkInput.value;

// When max chunk size changes, update slider bounds and persist
maxChunkInput.addEventListener("change", () => {
  const val = parseInt(maxChunkInput.value.trim() || "", 10);
  const safeVal = isNaN(val) ? DEFAULT_MAX_CHUNK_SIZE : val;
  maxChunkInput.value = safeVal.toString();
  chunkSlider.max = safeVal.toString();
  localStorage.setItem("maxChunk", maxChunkInput.value.trim());
  // Ensure current chunk value is within new bounds
  syncChunkInputs("number");
});

// --- History toggle ---
toggleHistoryBtn.addEventListener("click", () => {
  const showing = historyOutput.style.display === "block";
  historyOutput.style.display = showing ? "none" : "block";
  toggleHistoryBtn.textContent = showing
    ? "Show Conversation History"
    : "Hide Conversation History";
});

analyzeBtn.addEventListener("click", async () => {
  // Reset progress UI
  progressBarInner.style.width = "0%";
  progressBar.style.display = "block";

  let logsText = logsInput.value.trim();

  if (!logsText) {
    const file = fileInput.files?.[0];
    if (file) {
      if (file.size > MAX_SIZE_BYTES) {
        alert("File exceeds 5 MB limit");
        return;
      }
      logsText = await file.text();
    }
  }

  if (!logsText) {
    alert("Please provide logs via textarea or file");
    return;
  }

  let apiKey = decryptedApiKey || apiKeyInput.value.trim();

  if (!apiKey) {
    alert("Please set API key first.");
    return;
  }

  // Handle saving logic
  if (saveKeyChk.checked) {
    if (!passphraseInput.value) {
      alert("Enter a passphrase to encrypt the key.");
      return;
    }
    storedEnc = localStorage.getItem("encApiKey");
    if (!storedEnc || decryptedApiKey !== apiKey) {
      // Either not saved yet or key changed – encrypt and save
      const enc = await encryptApiKey(apiKey, passphraseInput.value);
      localStorage.setItem("encApiKey", JSON.stringify(enc));
      storedEnc = JSON.stringify(enc);

      // Remove any previously stored plain key
      localStorage.removeItem("plainApiKey");

      const hintVal = passHintInput.value.trim();
      if (hintVal) {
        localStorage.setItem("encHint", hintVal);
        hintDisplay.textContent = `Hint: ${hintVal}`;
        hintDisplay.style.display = "block";
      } else {
        localStorage.removeItem("encHint");
        hintDisplay.style.display = "none";
      }

      // Hide hint input after save
      passHintInput.style.display = "none";
      updateKeyStatus();
    }
  } else if (savePlainChk.checked) {
    // Save key in plain text (insecure)
    localStorage.setItem("plainApiKey", apiKey);
    // Remove any encrypted records
    localStorage.removeItem("encApiKey");
    localStorage.removeItem("encHint");
    hintDisplay.style.display = "none";
    updateKeyStatus();
  } else {
    // Do not save anything
    localStorage.removeItem("encApiKey");
    localStorage.removeItem("encHint");
    localStorage.removeItem("plainApiKey");
    hintDisplay.style.display = "none";
    updateKeyStatus();
  }

  const host = hostInput.value.trim() || "https://openrouter.ai/api/v1";
  const model = modelInput.value.trim() || DEFAULT_MODEL;
  const chunkSize =
    parseInt(chunkInput.value.trim() || "", 10) || DEFAULT_CHUNK_SIZE;

  analyzeBtn.disabled = true;
  resultOutput.textContent = "Analyzing...";

  // Ensure result is visible
  resultOutput.scrollIntoView({ behavior: "smooth" });

  try {
    const extraInstr = instrInput.value.trim();

    // Clear previous chat bubbles
    historyOutput.innerHTML = "";

    const { summary, history } = await analyzeLogs({
      apiKey,
      host,
      model,
      chunkSize,
      logs: logsText,
      extraInstruction: extraInstr,
      onProgress: (current, total) => {
        resultOutput.textContent = `Processed chunk ${current}/${total}`;
        const pct = Math.round((current / total) * 100);
        progressBarInner.style.width = pct + "%";
      },
      onHistory: (inc) => {
        appendHistory(inc);
      },
    });

    resultOutput.textContent = summary || "No summary generated";
    progressBarInner.style.width = "100%";
  } catch (err: any) {
    resultOutput.textContent = `Error: ${err.message || err}`;
  } finally {
    analyzeBtn.disabled = false;
    // Hide progress bar after slight delay to allow user to see 100%
    setTimeout(() => {
      progressBar.style.display = "none";
    }, 800);
  }
});
