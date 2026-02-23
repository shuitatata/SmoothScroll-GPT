/* global SSG_CONFIG, SSG_RUNTIME */
(function initOptions() {
  const { normalizeConfig, DEFAULT_CONFIG } = SSG_CONFIG;
  const { COMMANDS, sendRuntimeMessage } = SSG_RUNTIME;

  const nodes = {
    enabled: document.getElementById("enabled"),
    maxMountedMessages: document.getElementById("maxMountedMessages"),
    overscanCount: document.getElementById("overscanCount"),
    preserveTailCount: document.getElementById("preserveTailCount"),
    debug: document.getElementById("debug"),
    save: document.getElementById("save"),
    reset: document.getElementById("reset"),
    status: document.getElementById("status"),
  };

  function showStatus(message, isError) {
    nodes.status.textContent = message;
    nodes.status.style.color = isError ? "#9d2e2e" : "#1a5f41";
  }

  function applyConfig(config) {
    const safe = normalizeConfig(config || DEFAULT_CONFIG);
    nodes.enabled.checked = safe.enabled;
    nodes.maxMountedMessages.value = String(safe.maxMountedMessages);
    nodes.overscanCount.value = String(safe.overscanCount);
    nodes.preserveTailCount.value = String(safe.preserveTailCount);
    nodes.debug.checked = safe.debug;
  }

  function readConfigFromForm() {
    return normalizeConfig({
      enabled: nodes.enabled.checked,
      maxMountedMessages: Number(nodes.maxMountedMessages.value),
      overscanCount: Number(nodes.overscanCount.value),
      preserveTailCount: Number(nodes.preserveTailCount.value),
      debug: nodes.debug.checked,
    });
  }

  async function loadConfig() {
    const response = await sendRuntimeMessage({ type: COMMANDS.GET_CONFIG });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "加载配置失败");
    }
    applyConfig(response.config);
  }

  async function saveConfig(config) {
    const response = await sendRuntimeMessage({ type: COMMANDS.SET_CONFIG, config });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "保存配置失败");
    }
    applyConfig(response.config);
    showStatus("配置已保存并同步到标签页", false);
  }

  nodes.save.addEventListener("click", () => {
    const config = readConfigFromForm();
    saveConfig(config).catch((error) => showStatus(error.message, true));
  });

  nodes.reset.addEventListener("click", () => {
    saveConfig({ ...DEFAULT_CONFIG }).catch((error) => showStatus(error.message, true));
  });

  loadConfig().catch((error) => showStatus(error.message, true));
})();
