/* global importScripts, SSG_CONFIG, SSG_RUNTIME */
importScripts("shared/config.js", "shared/runtime.js");

const { DEFAULT_CONFIG, mergeConfig, normalizeConfig } = SSG_CONFIG;
const { COMMANDS, EVENTS, STORAGE_KEYS, getApi, storageGet, storageSet } = SSG_RUNTIME;

const api = getApi();
let cachedConfig = { ...DEFAULT_CONFIG };

async function loadConfig() {
  try {
    const result = await storageGet(STORAGE_KEYS.CONFIG);
    cachedConfig = normalizeConfig(result[STORAGE_KEYS.CONFIG]);
  } catch (error) {
    cachedConfig = { ...DEFAULT_CONFIG };
  }
  return cachedConfig;
}

async function saveConfig(nextConfig) {
  cachedConfig = normalizeConfig(nextConfig);
  await storageSet({ [STORAGE_KEYS.CONFIG]: cachedConfig });
  await broadcast({ type: EVENTS.CONFIG_UPDATED, config: cachedConfig });
  return cachedConfig;
}

function listControlledTabs() {
  return new Promise((resolve, reject) => {
    api.tabs.query(
      {
        url: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
      },
      (tabs) => {
        const runtimeError = api.runtime && api.runtime.lastError ? api.runtime.lastError : null;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(tabs || []);
      },
    );
  });
}

async function broadcast(payload) {
  try {
    const tabs = await listControlledTabs();
    await Promise.all(
      tabs
        .filter((tab) => typeof tab.id === "number")
        .map(
          (tab) =>
            new Promise((resolve) => {
              api.tabs.sendMessage(tab.id, payload, () => {
                resolve();
              });
            }),
        ),
    );
  } catch (error) {
    // 广播失败不应阻塞配置写入。
  }
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const runtimeError = api.runtime && api.runtime.lastError ? api.runtime.lastError : null;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve((tabs || [])[0] || null);
    });
  });
}

function sendToTab(tabId, payload) {
  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, payload, (response) => {
      const runtimeError = api.runtime && api.runtime.lastError ? api.runtime.lastError : null;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(response);
    });
  });
}

api.runtime.onInstalled.addListener(() => {
  loadConfig().then((config) => saveConfig(config)).catch(() => {
    cachedConfig = { ...DEFAULT_CONFIG };
  });
});

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const request = message || {};

  (async () => {
    if (request.type === COMMANDS.GET_CONFIG) {
      const config = await loadConfig();
      sendResponse({ ok: true, config });
      return;
    }

    if (request.type === COMMANDS.SET_CONFIG) {
      const next = mergeConfig(await loadConfig(), request.config || {});
      const config = await saveConfig(next);
      sendResponse({ ok: true, config });
      return;
    }

    if (request.type === COMMANDS.TOGGLE_ENABLED) {
      const current = await loadConfig();
      const config = await saveConfig({ ...current, enabled: !current.enabled });
      sendResponse({ ok: true, config });
      return;
    }

    if (request.type === COMMANDS.RESTORE_ALL || request.type === COMMANDS.GET_ACTIVE_TAB_STATS) {
      const activeTab = await getActiveTab();
      if (!activeTab || typeof activeTab.id !== "number") {
        sendResponse({ ok: false, error: "未找到活动标签页" });
        return;
      }

      const forwardedType = request.type === COMMANDS.RESTORE_ALL ? COMMANDS.RESTORE_ALL : COMMANDS.GET_STATS;
      const response = await sendToTab(activeTab.id, { type: forwardedType });
      sendResponse({ ok: true, response: response || {} });
      return;
    }

    // 忽略未知指令，避免与页面脚本冲突。
    sendResponse({ ok: false, error: "未知命令" });
  })().catch((error) => {
    sendResponse({ ok: false, error: error && error.message ? error.message : String(error) });
  });

  return true;
});
