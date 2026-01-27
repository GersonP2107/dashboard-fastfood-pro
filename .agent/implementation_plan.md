---
description: Implement an AI Business Assistant powered by a custom Bun AI API
title: AI Business Assistant Implementation
---

# AI Business Assistant Implementation Plan

This plan outlines the steps to integrate an AI-powered chat assistant into the dashboard. The assistant will communicate with a custom Bun AI API and have access to business data (finance, orders, products) to answer user queries.

## 1. Setup & Dependencies
- [ ] Install `ai` SDK: `npm install ai`
- [ ] Configure Environment Variables: Add `BUN_AI_API_URL` to `.env.local` (default to `http://localhost:3000/chat` - User to verify port).

## 2. Backend Logic (The "Brain")
- [ ] **Create AI Tools Wrapper (`lib/ai/tools-wrapper.ts`)**:
    - Import existing server actions (`getFinancialStats`, `getOrders`, `getProducts`).
    - Define a schema/definition for each tool to be injected into the system prompt.
    - Create a dispatcher function that executes the appropriate server action based on the AI's "tool call" string.

- [ ] **Create Chat API Route (`app/api/chat/route.ts`)**:
    - POST endpoint to handle chat requests.
    - **Prompt Engineering**: Construct a system prompt that:
        - Defines the assistant's persona (Business Analyst).
        - Lists available tools (JSON capabilities).
        - Instructs the AI to output a specific JSON pattern (e.g., `<<TOOL_CALL: {"name": "...", "args": ...}>>`) when it needs data.
    - **Message Handling**:
        - Forward the conversation to the external Bun AI API.
        - **Stream Parsing**: Intercept the incoming text stream.
        - **Tool Execution Interceptor**:
            - If a tool call pattern is detected in the stream:
                - Pause the stream to the client.
                - Execute the local server action (DB query).
                - Append the result as a "System" message to the history.
                - Re-submit the updated history to the Bun AI API to get the final answer.
            - If no tool call, transparently stream the text chunks to the client.

## 3. Frontend UI
- [ ] **Create Chat Widget Component (`components/ai/ChatWidget.tsx`)**:
    - Floating button (bottom-right) to toggle chat window.
    - Chat interface with:
        - Message history (User vs System).
        - Input field.
        - "Thinking..." indicators.
        - Markdown rendering for rich responses.
    - Use `fetch` (or `useChat` from `ai` SDK if compatible with our proxy) to define the chat loop. Since we are proxying through our own `api/chat`, standard `useChat` should work well for state management.

- [ ] **Integrate into Layout (`app/(dashboard)/layout.tsx`)**:
    - Add the `ChatWidget` so it persists across pages.

## 4. Verification
- [ ] Test simple "Hello" (Proxy check).
- [ ] Test "How are my sales today?" (Tool: `getFinancialStats`).
- [ ] Test "List my top products" (Tool: `getFinancialStats` -> `topProducts`).

