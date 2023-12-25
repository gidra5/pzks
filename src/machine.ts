import { CostTable } from "./types";
import { Tree } from "./utils";

type State = "compute" | "read" | "write" | "noop";
type ThreadState = { state: State; time: number; taskId?: number };

const nextThreadState = (threadState: ThreadState): ThreadState => {
  if (threadState.state === "noop" || threadState.state === "write")
    return { state: "noop", time: 0 };
  if (threadState.state === "read") return { ...threadState, state: "compute" };
  if (threadState.state === "compute" && threadState.time === 1)
    return { ...threadState, state: "write", time: 0 };
  return { ...threadState, time: threadState.time - 1 };
};
const setupThread = (time: number, taskId: number): ThreadState => ({
  state: "read",
  time,
  taskId,
});

const isBusy = (threadState: ThreadState): boolean =>
  threadState.state !== "noop";
const isMemoryState = (threadState: ThreadState): boolean =>
  threadState.state === "read" || threadState.state === "write";
const isMemoryBusy = (
  threadStates: ThreadState[],
  maxBusyThreads: number
): boolean => threadStates.filter(isMemoryState).length >= maxBusyThreads;
const isMemoryTooBusy = (
  threadStates: ThreadState[],
  maxBusyThreads: number
): boolean => threadStates.filter(isMemoryState).length > maxBusyThreads;

export const machineStates = (
  tree: Tree,
  costTable: CostTable,
  n = 2,
  m = 1
): State[][] => {
  const states: State[][] = [];
  let threads = Array(n).fill({ state: "noop", time: 0 });
  let taskId = 1;
  const snapshot = () => {
    states.push(threads.map((thread) => thread.state));
  };
  const step = () => {
    snapshot();
    threads = threads.map(nextThreadState);
    while (isMemoryTooBusy(threads, m)) {
      const memoryThreads = threads
        .map((t, i) => [t, i])
        .filter(([t, i]) => isMemoryState(t));
      const x = memoryThreads.slice(m, memoryThreads.length);
      x.forEach(([, i]) => (threads[i] = { state: "noop", time: 0 }));
      step();
      x.forEach(([t, i]) => (threads[i] = t));
    }
  };

  // const waitTasks = (taskIds: number[]) => {
  //   while (threads.some((thread) => taskIds.includes(thread.taskId))) {
  //     step();
  //   }
  // };

  const scheduleTask = (time: number): number => {
    while (threads.every(isBusy) || isMemoryBusy(threads, m)) {
      step();
    }
    let threadIndex = threads.findIndex((thread) => !isBusy(thread));
    const id = taskId++;
    threads[threadIndex] = setupThread(time, id);
    return id;
  };

  const traverseTree = ([currentNode, ...queue]: Tree[]): Tree[] => {
    if (!currentNode) return [];

    if (!currentNode.children || currentNode.children.length === 0) {
      if (currentNode.type === "fn") {
        return [currentNode, ...traverseTree(queue)];
      }
    } else {
      const nodes = traverseTree([...queue, ...currentNode.children]);
      return [currentNode, ...nodes];
    }
    return traverseTree(queue);
  };

  const processTree = (tree: Tree) => {
    const nodes: Tree[] = traverseTree([tree]);

    nodes.reverse().forEach((node) => {
      if (threads.every(isBusy)) {
        while (threads.some(isBusy)) {
          step();
        }
      }
      scheduleTask(costTable[node.name] ?? 1);
    });
  };

  // const id = processTree(tree);
  processTree(tree);

  while (threads.some(isBusy)) {
    step();
  }
  // if (id) waitTasks([id]);

  return states;
};
