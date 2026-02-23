(function initSsgRuntime(global) {
  const COMMANDS = Object.freeze({
    GET_CONFIG: "GET_CONFIG",
    SET_CONFIG: "SET_CONFIG",
    TOGGLE_ENABLED: "TOGGLE_ENABLED",
    RESTORE_ALL: "RESTORE_ALL",
    GET_STATS: "GET_STATS",
    GET_ACTIVE_TAB_STATS: "GET_ACTIVE_TAB_STATS",
    ENABLE: "ENABLE",
    DISABLE: "DISABLE",
  });

  const EVENTS = Object.freeze({
    CONFIG_UPDATED: "CONFIG_UPDATED",
  });

  const STORAGE_KEYS = Object.freeze({
    CONFIG: "ssgConfig",
  });

  function getApi() {
    return global.browser || global.chrome || null;
  }

  function isBrowserNamespace(api) {
    return typeof global.browser !== "undefined" && api === global.browser;
  }

  function sendRuntimeMessage(message) {
    const api = getApi();
    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.reject(new Error("扩展 runtime API 不可用"));
    }

    if (isBrowserNamespace(api)) {
      return api.runtime.sendMessage(message);
    }

    return new Promise((resolve, reject) => {
      api.runtime.sendMessage(message, (response) => {
        const runtimeError = (global.chrome && global.chrome.runtime && global.chrome.runtime.lastError)
          ? global.chrome.runtime.lastError
          : null;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function storageGet(key) {
    const api = getApi();
    if (!api || !api.storage || !api.storage.local) {
      return Promise.reject(new Error("扩展 storage API 不可用"));
    }

    if (isBrowserNamespace(api)) {
      return api.storage.local.get(key);
    }

    return new Promise((resolve, reject) => {
      api.storage.local.get(key, (result) => {
        const runtimeError = (global.chrome && global.chrome.runtime && global.chrome.runtime.lastError)
          ? global.chrome.runtime.lastError
          : null;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(result || {});
      });
    });
  }

  function storageSet(items) {
    const api = getApi();
    if (!api || !api.storage || !api.storage.local) {
      return Promise.reject(new Error("扩展 storage API 不可用"));
    }

    if (isBrowserNamespace(api)) {
      return api.storage.local.set(items);
    }

    return new Promise((resolve, reject) => {
      api.storage.local.set(items, () => {
        const runtimeError = (global.chrome && global.chrome.runtime && global.chrome.runtime.lastError)
          ? global.chrome.runtime.lastError
          : null;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve();
      });
    });
  }

  global.SSG_RUNTIME = {
    COMMANDS,
    EVENTS,
    STORAGE_KEYS,
    getApi,
    sendRuntimeMessage,
    storageGet,
    storageSet,
  };
})(globalThis);
