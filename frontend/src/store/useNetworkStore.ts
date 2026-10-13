import { create } from "zustand";

// Below ~4Mbps of measured throughput the connection counts as slow.
const SLOW_BYTES_PER_MS = 500;
// Ignore small files, where latency dominates over bandwidth.
const MIN_SAMPLE_FILE_BYTES = 30_000;
const MIN_TOTAL_SAMPLE_BYTES = 200_000;

// Measures what this browser actually downloaded so far, from Resource Timing.
// Works in every engine (Samsung Internet, Safari, in-app WebViews), unlike
// navigator.connection, and costs no extra download.
const measureBytesPerMs = () => {
  if (typeof performance === "undefined") return null;

  const samples = (
    performance.getEntriesByType("resource") as PerformanceResourceTiming[]
  ).filter(
    (entry) =>
      // transferSize is 0 for cache hits and for cross-origin files.
      entry.transferSize >= MIN_SAMPLE_FILE_BYTES &&
      entry.responseStart > 0 &&
      entry.responseEnd > entry.responseStart,
  );

  const totalBytes = samples.reduce((sum, entry) => sum + entry.transferSize, 0);
  if (totalBytes < MIN_TOTAL_SAMPLE_BYTES) return null;

  // Parallel downloads share the line, so count overlapping time only once.
  const intervals = samples
    .map((entry) => [entry.responseStart, entry.responseEnd])
    .sort((a, b) => a[0] - b[0]);
  let busyMs = 0;
  let [start, end] = intervals[0];
  for (const [nextStart, nextEnd] of intervals.slice(1)) {
    if (nextStart > end) {
      busyMs += end - start;
      [start, end] = [nextStart, nextEnd];
    } else {
      end = Math.max(end, nextEnd);
    }
  }
  busyMs += end - start;

  return totalBytes / busyMs;
};

interface NetworkState {
  isSlowNetwork: boolean;
  measureNetworkSpeed: () => void;
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  isSlowNetwork: false,
  measureNetworkSpeed: () => {
    const bytesPerMs = measureBytesPerMs();
    if (bytesPerMs !== null) {
      set({ isSlowNetwork: bytesPerMs < SLOW_BYTES_PER_MS });
    }
  },
}));
