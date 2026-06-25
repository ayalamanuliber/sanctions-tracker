#!/usr/bin/env sh
set -eu

MCP_NAME="${LEGAL_AI_RISK_MCP_NAME:-legal-ai-risk}"
MCP_URL="${LEGAL_AI_RISK_MCP_URL:-https://sanctions-tracker.vercel.app/mcp}"

say() {
  printf '%s\n' "$1"
}

installed_any=0

if command -v claude >/dev/null 2>&1; then
  say "Installing ${MCP_NAME} into Claude..."
  claude mcp add --transport http "${MCP_NAME}" "${MCP_URL}" >/dev/null
  say "Claude install complete."
  installed_any=1
fi

if command -v codex >/dev/null 2>&1; then
  say "Installing ${MCP_NAME} into Codex..."
  codex mcp add "${MCP_NAME}" --url "${MCP_URL}" >/dev/null
  say "Codex install complete."
  installed_any=1
fi

if [ "${installed_any}" -eq 0 ]; then
  say "No supported local MCP client was detected."
fi

say ""
say "ChatGPT install is UI-based:"
say "1. Open ChatGPT on the web."
say "2. Enable Developer mode under Settings -> Apps -> Advanced settings."
say "3. Create a custom MCP app."
say "4. Use this endpoint:"
say "   ${MCP_URL}"
say "5. Choose No Authentication for the current public read-only version."
