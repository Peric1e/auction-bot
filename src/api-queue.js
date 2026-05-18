import PQueue from "p-queue";

export const apiQueue = new PQueue({
  concurrency: 1,
  interval: 1000,
  maxSize: 30,
  timeout: 5000
});

// Logging
apiQueue.on("add", () => {
  if (apiQueue.size > 0) {
    console.log(`📊 Queue: ${apiQueue.size} задач`);
  }
});