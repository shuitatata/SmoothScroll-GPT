/* global SSG_CONFIG, SSG_RUNTIME */
(function initPopup() {
  const { normalizeConfig, DEFAULT_CONFIG } = SSG_CONFIG;
  const { COMMANDS, sendRuntimeMessage } = SSG_RUNTIME;

  const nodes = {
    enabled: document.getElementById("enabled"),
    adaptiveEnabled: document.getElementById("adaptiveEnabled"),
    maxMountedMessages: document.getElementById("maxMountedMessages"),
    overscanCount: document.getElementById("overscanCount"),
    preserveTailCount: document.getElementById("preserveTailCount"),
    debug: document.getElementById("debug"),
    save: document.getElementById("save"),
    restore: document.getElementById("restore"),
    refreshStats: document.getElementById("refreshStats"),
    stats: document.getElementById("stats"),
    status: document.getElementById("status"),
  };

  function showStatus(message, isError) {
    nodes.status.textContent = message;
    nodes.status.style.color = isError ? "#9d2e2e" : "#213b2d";
  }

  function fillConfig(config) {
    const safe = normalizeConfig(config || DEFAULT_CONFIG);
    nodes.enabled.checked = safe.enabled;
    nodes.adaptiveEnabled.checked = safe.adaptiveEnabled;
    nodes.maxMountedMessages.value = String(safe.maxMountedMessages);
    nodes.overscanCount.value = String(safe.overscanCount);
    nodes.preserveTailCount.value = String(safe.preserveTailCount);
    nodes.debug.checked = safe.debug;
  }

  function collectConfig() {
    return normalizeConfig({
      enabled: nodes.enabled.checked,
      adaptiveEnabled: nodes.adaptiveEnabled.checked,
      maxMountedMessages: Number(nodes.maxMountedMessages.value),
      overscanCount: Number(nodes.overscanCount.value),
      preserveTailCount: Number(nodes.preserveTailCount.value),
      debug: nodes.debug.checked,
    });
  }

  async function loadConfig() {
    const response = await sendRuntimeMessage({ type: COMMANDS.GET_CONFIG });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "读取配置失败");
    }
    fillConfig(response.config);
  }

  async function saveConfig() {
    const config = collectConfig();
    const response = await sendRuntimeMessage({ type: COMMANDS.SET_CONFIG, config });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "保存配置失败");
    }
    fillConfig(response.config);
    showStatus("配置已保存", false);
  }

  async function restoreAll() {
    const response = await sendRuntimeMessage({ type: COMMANDS.RESTORE_ALL });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "恢复失败");
    }
    showStatus("已触发恢复全部消息", false);
  }

  async function refreshStats() {
    const response = await sendRuntimeMessage({ type: COMMANDS.GET_ACTIVE_TAB_STATS });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "读取状态失败");
    }

    const stats = response.response && response.response.stats ? response.response.stats : {};
    nodes.stats.textContent = JSON.stringify(stats, null, 2);
  }

  nodes.save.addEventListener("click", () => {
    saveConfig().catch((error) => showStatus(error.message, true));
  });

  nodes.restore.addEventListener("click", () => {
    restoreAll().catch((error) => showStatus(error.message, true));
  });

  nodes.refreshStats.addEventListener("click", () => {
    refreshStats().catch((error) => showStatus(error.message, true));
  });

  loadConfig()
    .then(() => refreshStats())
    .catch((error) => showStatus(error.message, true));
})();
