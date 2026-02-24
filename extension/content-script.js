/* global SSG_CONFIG, SSG_RUNTIME, SSG_WINDOWING */
(function initSmoothScrollGpt() {
  if (window.__SSG_VIRTUALIZER__) {
    return;
  }

  const { DEFAULT_CONFIG, mergeConfig, normalizeConfig, createEmptyStats } = SSG_CONFIG;
  const { COMMANDS, EVENTS, sendRuntimeMessage } = SSG_RUNTIME;
  const { computeVisibleRange, computeDesiredIndices } = SSG_WINDOWING;

  const MESSAGE_SELECTORS = [
    'article[data-testid^="conversation-turn-"]',
    'div[data-testid^="conversation-turn-"]',
    'div[data-message-author-role]',
  ];

  const CONTAINER_SELECTORS = [
    'main [data-testid="conversation-turns"]',
    'main div[role="presentation"]',
    'main',
  ];

  function findContainer() {
    for (const selector of CONTAINER_SELECTORS) {
      const candidate = document.querySelector(selector);
      if (!candidate) {
        continue;
      }
      if (selector === "main") {
        const count = candidate.querySelectorAll('div[data-message-author-role], article[data-testid^="conversation-turn-"]').length;
        if (count < 2) {
          continue;
        }
      }
      return candidate;
    }
    return null;
  }

  function detectScrollableAncestor(element) {
    let current = element;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const isScrollable = (overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight + 32;
      if (isScrollable) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }

  function queryMessages(container) {
    const bySelector = [];
    for (const selector of MESSAGE_SELECTORS) {
      const nodes = Array.from(container.querySelectorAll(selector));
      for (const node of nodes) {
        if (!bySelector.includes(node)) {
          bySelector.push(node);
        }
      }
      if (bySelector.length >= 2) {
        break;
      }
    }
    return bySelector;
  }

  function isNodeConnected(node) {
    return Boolean(node && node.isConnected);
  }

  class DomVirtualizer {
    constructor() {
      this.config = { ...DEFAULT_CONFIG };
      this.container = null;
      this.scrollRoot = window;
      this.records = new Map();
      this.nextId = 1;
      this.updateScheduled = false;
      this.bound = false;
      this.isFailOpen = false;

      this.stats = createEmptyStats();
      this.frameSamples = [];
      this.lastFrameTs = 0;

      this.mutationObserver = null;
      this.placeholderObserver = null;

      this.onScroll = this.onScroll.bind(this);
      this.onMutate = this.onMutate.bind(this);
      this.onPlaceholderIntersect = this.onPlaceholderIntersect.bind(this);
    }

    async init() {
      await this.reloadConfig();
      this.tryBind();
      this.startFrameSampler();
      this.registerRuntimeListener();
    }

    async reloadConfig() {
      try {
        const response = await sendRuntimeMessage({ type: COMMANDS.GET_CONFIG });
        if (response && response.ok) {
          this.config = normalizeConfig(response.config);
          return;
        }
      } catch (error) {
        this.stats.lastError = `读取配置失败：${error.message}`;
      }
      this.config = { ...DEFAULT_CONFIG };
    }

    registerRuntimeListener() {
      const api = window.browser || window.chrome;
      if (!api || !api.runtime || !api.runtime.onMessage) {
        return;
      }

      api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        const request = message || {};
        if (request.type === EVENTS.CONFIG_UPDATED) {
          this.setConfig(request.config || {});
          sendResponse({ ok: true });
          return true;
        }

        if (request.type === COMMANDS.ENABLE) {
          this.setConfig({ enabled: true });
          sendResponse({ ok: true });
          return true;
        }

        if (request.type === COMMANDS.DISABLE) {
          this.setConfig({ enabled: false });
          sendResponse({ ok: true });
          return true;
        }

        if (request.type === COMMANDS.SET_CONFIG) {
          this.setConfig(request.config || {});
          sendResponse({ ok: true });
          return true;
        }

        if (request.type === COMMANDS.RESTORE_ALL) {
          this.restoreAll();
          sendResponse({ ok: true });
          return true;
        }

        if (request.type === COMMANDS.GET_STATS) {
          sendResponse({ ok: true, stats: this.getStats() });
          return true;
        }

        return false;
      });
    }

    setConfig(nextPatch) {
      this.config = mergeConfig(this.config, nextPatch || {});
      if (!this.config.enabled) {
        this.restoreAll();
      }
      this.scheduleUpdate();
    }

    tryBind() {
      if (this.bound && isNodeConnected(this.container)) {
        return;
      }

      const container = findContainer();
      if (!container) {
        window.setTimeout(() => this.tryBind(), 1000);
        return;
      }

      this.container = container;
      this.scrollRoot = detectScrollableAncestor(container);
      this.bound = true;
      this.setupObservers();
      this.syncRecords();
      this.scheduleUpdate();
    }

    setupObservers() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }

      this.mutationObserver = new MutationObserver(this.onMutate);
      this.mutationObserver.observe(this.container, { childList: true, subtree: true });

      if (this.scrollRoot === window) {
        window.addEventListener("scroll", this.onScroll, { passive: true });
      } else {
        this.scrollRoot.addEventListener("scroll", this.onScroll, { passive: true });
      }

      if (this.placeholderObserver) {
        this.placeholderObserver.disconnect();
      }

      this.placeholderObserver = new IntersectionObserver(this.onPlaceholderIntersect, {
        root: this.scrollRoot === window ? null : this.scrollRoot,
        rootMargin: "200px 0px 200px 0px",
      });
    }

    onScroll() {
      this.scheduleUpdate();
    }

    onMutate() {
      this.syncRecords();
      this.scheduleUpdate();
    }

    onPlaceholderIntersect(entries) {
      let hasRestore = false;
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        const placeholder = entry.target;
        const id = placeholder.getAttribute("data-ssg-virtual-id");
        if (!id) {
          continue;
        }
        const record = this.records.get(id);
        if (!record || record.state !== "trimmed") {
          continue;
        }
        this.restoreRecord(record);
        hasRestore = true;
      }

      if (hasRestore) {
        this.scheduleUpdate();
      }
    }

    startFrameSampler() {
      const tick = (ts) => {
        if (this.lastFrameTs > 0) {
          const delta = ts - this.lastFrameTs;
          this.frameSamples.push(delta);
          if (this.frameSamples.length > 120) {
            this.frameSamples.shift();
          }
          const total = this.frameSamples.reduce((sum, value) => sum + value, 0);
          this.stats.avgFrameDeltaMs = Number((total / this.frameSamples.length).toFixed(2));
        }
        this.lastFrameTs = ts;
        window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    }

    getStats() {
      return {
        ...this.stats,
        mountedCount: Array.from(this.records.values()).filter((record) => record.state === "mounted").length,
        trimmedCount: Array.from(this.records.values()).filter((record) => record.state === "trimmed").length,
      };
    }

    scheduleUpdate() {
      if (this.updateScheduled || this.isFailOpen) {
        return;
      }

      this.updateScheduled = true;
      window.requestAnimationFrame(() => {
        this.updateScheduled = false;
        try {
          this.updateWindow();
        } catch (error) {
          this.failOpen(error);
        }
      });
    }

    syncRecords() {
      if (!this.container || !isNodeConnected(this.container)) {
        this.bound = false;
        this.tryBind();
        return;
      }

      const messages = queryMessages(this.container);
      for (const node of messages) {
        if (!node.getAttribute("data-ssg-virtual-id")) {
          node.setAttribute("data-ssg-virtual-id", `msg-${this.nextId}`);
          this.nextId += 1;
        }

        const id = node.getAttribute("data-ssg-virtual-id");
        const record = this.records.get(id) || {
          id,
          state: "mounted",
          element: null,
          placeholder: null,
          cachedNode: null,
          height: 0,
          role: node.getAttribute("data-message-author-role") || "unknown",
        };

        if (record.state !== "trimmed") {
          record.element = node;
          record.cachedNode = node;
          record.state = "mounted";
        }

        this.records.set(id, record);
      }

      // 清理无效记录，避免会话切换后缓存持续增长。
      for (const [id, record] of this.records.entries()) {
        const active =
          isNodeConnected(record.element) ||
          isNodeConnected(record.placeholder) ||
          isNodeConnected(record.cachedNode);
        if (!active) {
          this.records.delete(id);
        }
      }
    }

    getFlowRecords() {
      const flowNodes = Array.from(this.container.querySelectorAll("[data-ssg-virtual-id]"));
      const ordered = [];

      for (const node of flowNodes) {
        const id = node.getAttribute("data-ssg-virtual-id");
        if (!id) {
          continue;
        }

        const record = this.records.get(id);
        if (!record) {
          continue;
        }

        if (record.state === "trimmed") {
          record.placeholder = node;
        } else {
          record.element = node;
          record.cachedNode = node;
        }

        ordered.push({
          id,
          record,
          flowNode: node,
        });
      }

      return ordered;
    }

    computeViewport() {
      if (this.scrollRoot === window) {
        return {
          top: 0,
          bottom: window.innerHeight,
        };
      }

      const rect = this.scrollRoot.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
      };
    }

    isProtectedRecord(index, total, ordered) {
      if (index >= total - this.config.preserveTailCount) {
        return true;
      }

      const activeElement = document.activeElement;
      if (!activeElement) {
        return false;
      }

      const item = ordered[index];
      if (!item) {
        return false;
      }

      return item.flowNode.contains(activeElement);
    }

    updateWindow() {
      if (!this.bound) {
        this.tryBind();
        return;
      }

      this.syncRecords();
      const ordered = this.getFlowRecords();
      const total = ordered.length;

      this.stats.estimatedNodeCount = this.container.getElementsByTagName("*").length;
      this.stats.lastUpdateAt = Date.now();
      this.stats.totalMessageCount = total;
      this.stats.maxMountedMessages = this.config.maxMountedMessages;

      if (total === 0) {
        return;
      }

      if (!this.config.enabled) {
        this.restoreAll();
        return;
      }

      const viewport = this.computeViewport();
      const layouts = ordered.map((entry) => {
        const rect = entry.flowNode.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
        };
      });

      const visibleRange = computeVisibleRange(layouts, viewport.top, viewport.bottom);
      const desired = computeDesiredIndices(
        total,
        visibleRange,
        this.config.overscanCount,
        this.config.preserveTailCount,
      );
      this.stats.desiredKeepCount = desired.size;

      const anchorIndex = Math.max(0, Math.min(visibleRange.firstVisible, total - 1));
      const anchorNodeBefore = ordered[anchorIndex] ? ordered[anchorIndex].flowNode : null;
      const anchorTopBefore = anchorNodeBefore ? anchorNodeBefore.getBoundingClientRect().top : 0;

      const keepIndices = new Set(desired);
      let protectedKeepCount = 0;
      for (let index = 0; index < ordered.length; index += 1) {
        if (this.isProtectedRecord(index, total, ordered)) {
          if (!keepIndices.has(index)) {
            protectedKeepCount += 1;
          }
          keepIndices.add(index);
        }
      }
      this.stats.protectedKeepCount = protectedKeepCount;

      if (total <= this.config.maxMountedMessages) {
        for (const item of ordered) {
          this.restoreRecord(item.record);
        }
        this.stats.effectiveKeepCount = total;
      } else {
        if (keepIndices.size < this.config.maxMountedMessages) {
          const candidates = [];
          for (let index = 0; index < ordered.length; index += 1) {
            if (keepIndices.has(index)) {
              continue;
            }

            let distance = 0;
            if (index < visibleRange.firstVisible) {
              distance = visibleRange.firstVisible - index;
            } else if (index > visibleRange.lastVisible) {
              distance = index - visibleRange.lastVisible;
            }

            candidates.push({ index, distance });
          }

          candidates.sort((a, b) => {
            if (a.distance !== b.distance) {
              return a.distance - b.distance;
            }
            return a.index - b.index;
          });

          const allowance = this.config.maxMountedMessages - keepIndices.size;
          for (let i = 0; i < allowance && i < candidates.length; i += 1) {
            keepIndices.add(candidates[i].index);
          }
        }

        for (let index = 0; index < ordered.length; index += 1) {
          const item = ordered[index];
          if (keepIndices.has(index)) {
            this.restoreRecord(item.record);
          } else {
            this.trimRecord(item.record);
          }
        }
        this.stats.effectiveKeepCount = keepIndices.size;
      }

      if (anchorNodeBefore && anchorNodeBefore.isConnected) {
        const anchorTopAfter = anchorNodeBefore.getBoundingClientRect().top;
        const delta = anchorTopAfter - anchorTopBefore;
        if (Math.abs(delta) > 1) {
          this.adjustScroll(delta);
        }
      }
    }

    adjustScroll(delta) {
      if (this.scrollRoot === window) {
        window.scrollTo({ top: window.scrollY + delta });
      } else {
        this.scrollRoot.scrollTop += delta;
      }
    }

    trimRecord(record) {
      if (!record || record.state !== "mounted" || !record.element || !record.element.isConnected) {
        return;
      }

      if (record.element.contains(document.activeElement)) {
        return;
      }

      const rect = record.element.getBoundingClientRect();
      const height = Math.max(24, Math.round(rect.height || 24));

      const placeholder = document.createElement("div");
      placeholder.className = "ssg-placeholder";
      placeholder.setAttribute("data-ssg-virtual-id", record.id);
      placeholder.style.height = `${height}px`;
      if (this.config.debug) {
        placeholder.textContent = "已折叠消息（滚动到此处自动恢复）";
      }

      record.height = height;
      record.cachedNode = record.element;
      record.element.replaceWith(placeholder);
      record.placeholder = placeholder;
      record.element = null;
      record.state = "trimmed";
      this.stats.cumulativeTrimOps += 1;

      if (this.placeholderObserver) {
        this.placeholderObserver.observe(placeholder);
      }
    }

    restoreRecord(record) {
      if (!record || record.state !== "trimmed") {
        return;
      }

      if (!record.placeholder || !record.cachedNode || !record.placeholder.isConnected) {
        return;
      }

      if (this.placeholderObserver) {
        this.placeholderObserver.unobserve(record.placeholder);
      }

      record.placeholder.replaceWith(record.cachedNode);
      record.element = record.cachedNode;
      record.placeholder = null;
      record.state = "mounted";
      this.stats.cumulativeRestoreOps += 1;
    }

    restoreAll() {
      for (const record of this.records.values()) {
        this.restoreRecord(record);
      }
    }

    failOpen(error) {
      this.isFailOpen = true;
      this.stats.lastError = error && error.message ? error.message : String(error);
      this.restoreAll();
      this.config.enabled = false;
      // 发生异常时保留观察器，便于后续通过配置重新启用。
      window.setTimeout(() => {
        this.isFailOpen = false;
      }, 500);
    }
  }

  const virtualizer = new DomVirtualizer();
  window.__SSG_VIRTUALIZER__ = virtualizer;
  virtualizer.init();
})();
