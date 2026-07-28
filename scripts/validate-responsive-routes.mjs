#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const baseUrl = process.env.RESPONSIVE_QA_BASE_URL || "http://localhost:3017/legal-ai-risk";
const chromeBinary =
  process.env.CHROME_BIN ||
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "google-chrome");
const routes = (
  process.env.RESPONSIVE_QA_ROUTES ||
  [
    "/",
    "/cases",
    "/cases/mata-v-avianca-inc-2023-06-22",
    "/judges",
    "/judges/vernon-d-oliver",
    "/courts/s-d-new-york",
    "/tools/chatgpt",
    "/about",
    "/analytics",
  ].join(",")
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const widths = (process.env.RESPONSIVE_QA_WIDTHS || "390,768,1280")
  .split(",")
  .map(Number)
  .filter(Number.isFinite);
const screenshotDir = process.env.RESPONSIVE_QA_SCREENSHOT_DIR || "";

const profileDir = await mkdtemp(path.join(tmpdir(), "aivortex-responsive-"));
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

async function openTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Could not open Chrome target (${response.status}).`);
  return response.json();
}

function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const promise = pending.get(message.id);
      if (!promise) return;
      pending.delete(message.id);
      if (message.error) promise.reject(new Error(message.error.message));
      else promise.resolve(message.result);
      return;
    }
    const eventListeners = listeners.get(message.method) || [];
    listeners.delete(message.method);
    for (const resolve of eventListeners) resolve(message.params);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    ready,
    send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        listeners.set(method, [...(listeners.get(method) || []), resolve]);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function inspectPage(client, route, width) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width <= 430 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width <= 430,
    screenWidth: width,
    screenHeight: width <= 430 ? 844 : 900,
  });

  const targetUrl = `${baseUrl}${route === "/" ? "" : route}`;
  await client.send("Page.navigate", { url: targetUrl });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = await client.send("Runtime.evaluate", {
      returnByValue: true,
      expression: "({readyState: document.readyState, pathname: location.pathname})",
    });
    if (
      ["interactive", "complete"].includes(state.result.value?.readyState) &&
      state.result.value?.pathname !== "/"
    ) {
      break;
    }
    if (
      ["interactive", "complete"].includes(state.result.value?.readyState) &&
      route === "/"
    ) {
      break;
    }
    await sleep(100);
  }
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const rendered = await client.send("Runtime.evaluate", {
      returnByValue: true,
      expression:
        "Boolean(document.querySelector('h1')) && !document.body.innerText.includes('Loading AI Vortex evidence')",
    });
    if (rendered.result.value) break;
    await sleep(100);
  }
  await sleep(250);

  const result = await client.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const root = document.documentElement;
      const viewportWidth = root.clientWidth;
      const overflow = [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
            text: (element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 80),
            href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "",
            parentClass:
              element.parentElement && typeof element.parentElement.className === "string"
                ? element.parentElement.className.slice(0, 120)
                : "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1))
        .sort((a, b) => Math.max(b.right - viewportWidth, -b.left) - Math.max(a.right - viewportWidth, -a.left))
        .slice(0, 8);

      return {
        viewportWidth,
        scrollWidth: root.scrollWidth,
        title: document.title,
        pathname: location.pathname,
        hasHeading: Boolean(document.querySelector("h1")),
        overflow,
      };
    })()`,
  });

  if (screenshotDir) {
    await mkdir(screenshotDir, { recursive: true });
    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    const routeName = route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replaceAll("/", "-");
    await writeFile(
      path.join(screenshotDir, `${routeName}-${width}.png`),
      Buffer.from(screenshot.data, "base64"),
    );
  }

  return {
    route,
    width,
    ...result.result.value,
  };
}

let exitCode = 0;

try {
  await waitForEndpoint();
  const target = await openTarget();
  const client = connect(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const results = [];
  for (const width of widths) {
    for (const route of routes) {
      results.push(await inspectPage(client, route, width));
    }
  }

  const failures = results.filter(
    (result) =>
      result.scrollWidth > result.viewportWidth + 1 ||
      !result.pathname.startsWith(new URL(baseUrl).pathname) ||
      !result.hasHeading ||
      /404|not found/i.test(result.title),
  );
  console.log(
    JSON.stringify(
      {
        status: failures.length ? "fail" : "pass",
        baseUrl,
        checked: results.length,
        failures,
      },
      null,
      2,
    ),
  );
  exitCode = failures.length ? 1 : 0;
  client.close();
} finally {
  await new Promise((resolve) => {
    if (chrome.exitCode !== null) {
      resolve();
      return;
    }
    chrome.once("exit", resolve);
    chrome.kill("SIGTERM");
  });
  await rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

process.exitCode = exitCode;
