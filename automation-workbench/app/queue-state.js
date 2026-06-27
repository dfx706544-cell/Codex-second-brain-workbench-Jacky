(function () {
  const PENDING_SYNC = "pending-shared-sync";

  function withoutSyncMetadata(task) {
    const { syncState, ...cleanTask } = task || {};
    return cleanTask;
  }

  function sortByCreatedAtDesc(tasks) {
    return [...tasks].sort((a, b) => {
      const left = Date.parse(a?.createdAt || "") || 0;
      const right = Date.parse(b?.createdAt || "") || 0;
      return right - left;
    });
  }

  function toLocalPendingTask(task) {
    return {
      ...task,
      syncState: PENDING_SYNC
    };
  }

  function mergeSharedAndLocalQueues(sharedQueue, localQueue) {
    const byId = new Map();
    const safeSharedQueue = Array.isArray(sharedQueue) ? sharedQueue : [];
    const safeLocalQueue = Array.isArray(localQueue) ? localQueue : [];
    const pendingLocalTasks = safeLocalQueue.filter((task) => task?.syncState === PENDING_SYNC);

    for (const task of safeSharedQueue) {
      if (task?.id) byId.set(task.id, withoutSyncMetadata(task));
    }

    for (const task of pendingLocalTasks) {
      if (task?.id) byId.set(task.id, withoutSyncMetadata(task));
    }

    return {
      queue: sortByCreatedAtDesc(Array.from(byId.values())),
      shouldUpload: pendingLocalTasks.length > 0
    };
  }

  window.WorkbenchQueueState = {
    mergeSharedAndLocalQueues,
    toLocalPendingTask
  };
})();
