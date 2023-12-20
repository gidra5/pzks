import { Tree } from "./utils";

type State = "compute" | "read" | "write" | "noop";
type ThreadState = { state: State; time: number };

const nextThreadState = (threadState: ThreadState): ThreadState => {
  if (threadState.state === "noop" || threadState.state === "read") return { state: "noop", time: 0 };
  if (threadState.state === "write") return { ...threadState, state: "compute" };
  if (threadState.state === "compute" && threadState.time === 0) return { ...threadState, state: "read" };
  return { ...threadState, time: threadState.time - 1 };
};
const setupThread = (time: number): ThreadState => ({ state: "write", time });

const isBusy = (threadState: ThreadState): boolean => threadState.state !== "noop";

export const machineStates = (tree: Tree, costTable: Record<string, number>): [State, State][] => {
  const states: [State, State][] = [];
  const tasks: Tree[] = [tree];
  let threadState1: ThreadState = { state: "noop", time: 0 };
  let threadState2: ThreadState = { state: "noop", time: 0 };
  const step = () => {
    states.push([threadState1.state, threadState2.state]);
    threadState1 = nextThreadState(threadState1);
    threadState2 = nextThreadState(threadState2);
  };
  const waitAllNotBusy = () => {
    while (isBusy(threadState1) || isBusy(threadState2)) {
      step();
    }
  };

  while (tasks.length > 0) {
    const task = tasks.pop()!;
    if (task.children) {
      tasks.push({ name: task.name, type: "sync" });
      tasks.push(...task.children);
    } else if (task.type === "sync") {
      waitAllNotBusy();
      continue;
    } else continue;
    if (!isBusy(threadState1)) {
      threadState1 = setupThread(costTable[task.name]);
      step();
      continue;
    }
    if (!isBusy(threadState2)) {
      threadState1 = setupThread(costTable[task.name]);
      step();
      continue;
    }
    while (isBusy(threadState1) && isBusy(threadState2)) {
      step();
    }
  }
  return states;
};
