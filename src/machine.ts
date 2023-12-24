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

export const machineStates = (
  tree: Tree,
  costTable: Record<string, number>,
  n = 2,
  m = 1
): State[][] => {
  const states: State[][] = [];
  let threads = Array(n).fill({ state: "noop", time: 0 });
  let taskId = 1;
  const step = () => {
    states.push(threads.map((thread) => thread.state));
    threads = threads.map(nextThreadState);
  };

  const waitTasks = (taskIds: number[]) => {
    while (threads.some((thread) => taskIds.includes(thread.taskId))) {
      step();
    }
  };

  const scheduleTask = (time: number): number => {
    while (threads.every(isBusy) || isMemoryBusy(threads, m)) {
      step();
    }
    let threadIndex = threads.findIndex((thread) => !isBusy(thread));
    const id = taskId++;
    threads[threadIndex] = setupThread(time, id);
    return id;
  };

  const processTree = (tree: Tree): number | undefined => {
    if (!tree.children || tree.children.length === 0) {
      if (tree.type === "fn") {
        return scheduleTask(costTable[tree.name] ?? 1);
      }
      return;
    }
    const ids = tree.children.map(processTree).filter(Boolean) as number[];

    waitTasks(ids);
    return scheduleTask(costTable[tree.name] ?? 1);
  };

  const id = processTree(tree);

  if (id) waitTasks([id]);

  return states;
};
