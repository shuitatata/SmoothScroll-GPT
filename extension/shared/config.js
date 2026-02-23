(function initSsgConfig(global) {
  const DEFAULT_CONFIG = Object.freeze({
    enabled: true,
    maxMountedMessages: 80,
    overscanCount: 8,
    preserveTailCount: 6,
    debug: false,
  });

  const LIMITS = Object.freeze({
    minMountedMessages: 0,
    maxMountedMessages: 120,
    minOverscanCount: 2,
    maxOverscanCount: 20,
    minPreserveTailCount: 2,
    maxPreserveTailCount: 20,
  });

  function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizeConfig(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      enabled: Boolean(source.enabled ?? DEFAULT_CONFIG.enabled),
      maxMountedMessages: clampInt(
        source.maxMountedMessages,
        LIMITS.minMountedMessages,
        LIMITS.maxMountedMessages,
        DEFAULT_CONFIG.maxMountedMessages,
      ),
      overscanCount: clampInt(
        source.overscanCount,
        LIMITS.minOverscanCount,
        LIMITS.maxOverscanCount,
        DEFAULT_CONFIG.overscanCount,
      ),
      preserveTailCount: clampInt(
        source.preserveTailCount,
        LIMITS.minPreserveTailCount,
        LIMITS.maxPreserveTailCount,
        DEFAULT_CONFIG.preserveTailCount,
      ),
      debug: Boolean(source.debug ?? DEFAULT_CONFIG.debug),
    };
  }

  function mergeConfig(base, patch) {
    return normalizeConfig({ ...(base || DEFAULT_CONFIG), ...(patch || {}) });
  }

  function createEmptyStats() {
    return {
      mountedCount: 0,
      trimmedCount: 0,
      totalMessageCount: 0,
      maxMountedMessages: DEFAULT_CONFIG.maxMountedMessages,
      estimatedNodeCount: 0,
      avgFrameDeltaMs: 0,
      lastError: "",
      lastUpdateAt: 0,
    };
  }

  global.SSG_CONFIG = {
    DEFAULT_CONFIG,
    LIMITS,
    normalizeConfig,
    mergeConfig,
    createEmptyStats,
  };
})(globalThis);
