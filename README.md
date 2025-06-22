# AI Log Analyzer

Light-weight, browser-only application that leverages large-language models to extract useful insights from plain-text logs.

## ✨ Features

* Paste log text (or upload a `.log` / `.txt` file up to **5 MB**).
* Configure the endpoint, model name and context limit.
* Adjustable chunk/token size – keeps requests under the model context window.
* Optional encryption for API keys – keys never leave your browser, encrypted ✱ before they are persisted in `localStorage`.
* Conversation history viewer so you can inspect every prompt/response pair.
* Works completely offline after the first load – perfect for sensitive logs.

## 🚀 Getting started

1. **Install Bun** (only needed for local development / builds).
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start the dev server**
   ```bash
   bun run dev
   # open http://localhost:3000
   ```

4. **Build for production**
   ```bash
   bun run build
   ```
   Static assets will be emitted to `dist/` and can be served by any static host.

## 🔧 Environment variables

The app runs fully in-browser. The only secret you need is your model provider API key which you enter in the UI (and can encrypt client-side). No server-side environment variables are required.

## 🛠️ Scripts

| command           | purpose                         |
| ----------------- | --------------------------------|
| `bun run dev`     | Run development server          |
| `bun run build`   | Bundle & minify to `dist/`      |
| `bun run preview` | Serve the bundled `dist` folder |

## 🤖 Continuous Integration

A lightweight GitHub Action verifies that the project builds on every pull-request and push to `main`. See `.github/workflows/ci.yml` for details.

## 📝 Contributing

1. Fork the repo and create your branch: `git checkout -b feat/my-amazing-idea`  
2. Commit your changes: `git commit -m "feat: my amazing idea"`               
3. Push to the branch: `git push origin feat/my-amazing-idea`                   
4. Open a pull-request.

Before submitting, please run `bun run build` to make sure everything still compiles.

## 🗒️ License

MIT © Sudhanshu Gautam
