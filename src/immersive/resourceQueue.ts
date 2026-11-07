/** Bounded loading with replaceable priorities, one retry and ownership of cached resources. */
export function createResourceQueue<T>(load: (url: string) => Promise<T>, release: (value: T) => void) {
  const cache = new Map<string, T>();
  const attempts = new Map<string, number>();
  const active = new Set<string>();
  let priorities: string[] = [];
  let disposed = false;

  function pump() {
    if (disposed) return;
    while (active.size < 2) {
      const url = priorities.find((candidate) => !cache.has(candidate) && !active.has(candidate) && (attempts.get(candidate) ?? 0) < 2);
      if (!url) break;
      active.add(url);
      attempts.set(url, (attempts.get(url) ?? 0) + 1);
      void Promise.resolve().then(() => load(url)).then((value) => {
        if (disposed) release(value);
        else cache.set(url, value);
      }).catch(() => { /* A failed resource keeps its native poster and link. */ }).finally(() => {
        active.delete(url);
        pump();
      });
    }
  }

  return {
    get: (url: string) => cache.get(url),
    prioritize(urls: string[]) { priorities = [...new Set(urls)]; pump(); },
    dispose() {
      disposed = true;
      priorities = [];
      cache.forEach(release);
      cache.clear();
    },
  };
}
