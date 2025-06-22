import {
  chunkInput,
  chunkSlider,
  keyStatus,
  clearKeyBtn,
  maxChunkInput,
} from "./dom.ts";
import {
  MIN_CHUNK_SIZE,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_MAX_CHUNK_SIZE,
} from "./constants.ts";

/**
 * Syncs numeric input and slider for chunk size.
 */
export function syncChunkInputs(src: "slider" | "number") {
  const maxAllowed = (() => {
    const parsed = parseInt(maxChunkInput.value || "", 10);
    return isNaN(parsed) || parsed < MIN_CHUNK_SIZE
      ? DEFAULT_MAX_CHUNK_SIZE
      : parsed;
  })();

  if (src === "slider") {
    chunkInput.value = chunkSlider.value;
  } else {
    let val = parseInt(chunkInput.value || "", 10);
    if (isNaN(val)) val = DEFAULT_CHUNK_SIZE;
    val = Math.max(MIN_CHUNK_SIZE, Math.min(maxAllowed, val));
    chunkInput.value = val.toString();
    chunkSlider.value = val.toString();
  }

  // Persist user choices
  localStorage.setItem("chunk", chunkInput.value.trim());
}

/**
 * Reflect whether an encrypted API key is stored in the UI.
 */
export function updateKeyStatus() {
  const enc = localStorage.getItem("encApiKey");
  const plain = localStorage.getItem("plainApiKey");
  if (enc) {
    keyStatus.textContent = "Encrypted key stored.";
    keyStatus.style.color = "green";
  } else if (plain) {
    keyStatus.textContent = "Key stored in plain text (unsafe).";
    keyStatus.style.color = "orange";
  } else {
    keyStatus.textContent = "API key not stored.";
    keyStatus.style.color = "red";
  }
  clearKeyBtn.style.display = enc || plain ? "inline-block" : "none";
}
