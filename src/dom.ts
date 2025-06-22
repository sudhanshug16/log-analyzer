// Centralized typed DOM element references
export const hostInput =
  document.querySelector<HTMLInputElement>("#hostInput")!;
export const apiKeyInput =
  document.querySelector<HTMLInputElement>("#apiKeyInput")!;
export const saveKeyChk =
  document.querySelector<HTMLInputElement>("#saveKeyChk")!;
export const savePlainChk =
  document.querySelector<HTMLInputElement>("#savePlainChk")!;
export const passphraseGroup =
  document.querySelector<HTMLDivElement>("#passphraseGroup")!;
export const passphraseInput =
  document.querySelector<HTMLInputElement>("#passphraseInput")!;
export const passHintInput =
  document.querySelector<HTMLInputElement>("#passHintInput")!;
export const hintDisplay =
  document.querySelector<HTMLParagraphElement>("#hintDisplay")!;
export const clearKeyBtn =
  document.querySelector<HTMLButtonElement>("#clearKeyBtn")!;
export const keyStatus =
  document.querySelector<HTMLParagraphElement>("#keyStatus")!;

export const modelInput =
  document.querySelector<HTMLInputElement>("#modelInput")!;
export const chunkInput =
  document.querySelector<HTMLInputElement>("#chunkInput")!;
export const chunkSlider =
  document.querySelector<HTMLInputElement>("#chunkSlider")!;

// Maximum chunk size per model
export const maxChunkInput =
  document.querySelector<HTMLInputElement>("#maxChunkInput")!;

export const logsInput =
  document.querySelector<HTMLTextAreaElement>("#logsInput")!;
export const fileInput =
  document.querySelector<HTMLInputElement>("#fileInput")!;
export const logSizeInfo =
  document.querySelector<HTMLParagraphElement>("#logSizeInfo")!;

export const analyzeBtn =
  document.querySelector<HTMLButtonElement>("#analyzeBtn")!;
export const clearLogsBtn =
  document.querySelector<HTMLButtonElement>("#clearLogsBtn")!;

// Progress bar elements
export const progressBar =
  document.querySelector<HTMLDivElement>("#progressBar")!;
export const progressBarInner =
  document.querySelector<HTMLDivElement>("#progressBarInner")!;
export const resultOutput =
  document.querySelector<HTMLPreElement>("#resultOutput")!;

export const instrInput =
  document.querySelector<HTMLTextAreaElement>("#instrInput")!;

export const toggleHistoryBtn =
  document.querySelector<HTMLButtonElement>("#toggleHistoryBtn")!;
export const historyOutput =
  document.querySelector<HTMLDivElement>("#historyOutput")!;
