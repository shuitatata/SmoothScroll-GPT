(function initSsgWindowing(global) {
  function computeVisibleRange(layouts, viewportTop, viewportBottom) {
    let firstVisible = -1;
    let lastVisible = -1;

    for (let index = 0; index < layouts.length; index += 1) {
      const layout = layouts[index];
      if (!layout) {
        continue;
      }

      const intersects = layout.bottom >= viewportTop && layout.top <= viewportBottom;
      if (!intersects) {
        continue;
      }

      if (firstVisible === -1) {
        firstVisible = index;
      }
      lastVisible = index;
    }

    if (firstVisible !== -1 && lastVisible !== -1) {
      return { firstVisible, lastVisible };
    }

    // 若当前没有可见项，回退到距离视口中心最近的条目。
    const viewportCenter = (viewportTop + viewportBottom) / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < layouts.length; index += 1) {
      const layout = layouts[index];
      if (!layout) {
        continue;
      }
      const center = (layout.top + layout.bottom) / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return {
      firstVisible: nearestIndex,
      lastVisible: nearestIndex,
    };
  }

  function computeDesiredIndices(total, visibleRange, overscanCount, preserveTailCount) {
    const desired = new Set();
    if (total <= 0) {
      return desired;
    }

    const firstVisible = Math.max(0, visibleRange.firstVisible || 0);
    const lastVisible = Math.min(total - 1, visibleRange.lastVisible || 0);
    const start = Math.max(0, firstVisible - overscanCount);
    const end = Math.min(total - 1, lastVisible + overscanCount);

    for (let index = start; index <= end; index += 1) {
      desired.add(index);
    }

    for (let index = Math.max(0, total - preserveTailCount); index < total; index += 1) {
      desired.add(index);
    }

    return desired;
  }

  global.SSG_WINDOWING = {
    computeVisibleRange,
    computeDesiredIndices,
  };
})(globalThis);
