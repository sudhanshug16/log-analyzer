# log-analyzer

CLI tool that analyzes logs using AI to identify errors and notable patterns.

## Installation

```bash
# Install globally
npm install -g log-analyzer

# Or install dependencies for local use
npm install
```

## Requirements

- OpenRouter API key set as environment variable:
```bash
export OPENROUTER_API_KEY=your_api_key_here
```

## Usage

```bash
# Using pipe with installed package
cat server.log | log-analyzer

# Using local development
cat server.log | bun index.ts

# Specify model and chunk size
cat server.log | log-analyzer --model anthropic/claude-3-haiku-20240307 --chunk-size 40000
```

## Options

- `--model <model>` - AI model to use (default: google/gemini-2.5-flash-preview)
- `--chunk-size <size>` - Token limit per chunk (default: 250,000)
- `-h, --help` - Show help information
