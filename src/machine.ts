import {
  generateAllCommutations,
  generateAllFactorizationCommutations,
  generateAllFactorizations,
} from "./optimizer";
import { stringFromTree } from "./tree";
import { CostTable } from "./types";
import { Tree, printTree, take } from "./utils";

type State = "compute" | "read" | "write" | "noop";
type ThreadState = {
  state: State;
  time: number;
  taskId?: number;
  label?: string;
};

const nextThreadState = (threadState: ThreadState): ThreadState => {
  if (threadState.state === "noop" || threadState.state === "write")
    return { state: "noop", time: 0 };
  if (threadState.state === "read") return { ...threadState, state: "compute" };
  if (threadState.state === "compute" && threadState.time === 1)
    return { ...threadState, state: "write", time: 0 };
  return { ...threadState, time: threadState.time - 1 };
};
const setupThread = (
  time: number,
  taskId: number,
  label: string
): ThreadState => ({
  state: "read",
  time,
  taskId,
  label,
});

const isBusy = (state: State): boolean => !state.includes("noop");
const isMemoryState = (state: State): boolean =>
  state.includes("read") || state.includes("write");

const isBusyThread = (threadState: ThreadState): boolean =>
  threadState.state !== "noop";
const isMemoryThreadState = (threadState: ThreadState): boolean =>
  threadState.state === "read" || threadState.state === "write";
const isMemoryBusy = (
  threadStates: ThreadState[],
  maxBusyThreads: number
): boolean => threadStates.filter(isMemoryThreadState).length >= maxBusyThreads;
const isMemoryTooBusy = (
  threadStates: ThreadState[],
  maxBusyThreads: number
): boolean => threadStates.filter(isMemoryThreadState).length > maxBusyThreads;

export const calculateLoad = (
  states: State[][],
  n: number,
  m: number
): [number[], number[]] => {
  return [
    Array(n)
      .fill(0)
      .map(
        (_, i) =>
          states.map((states) => states[i]).filter(isBusy).length /
          states.length
      ),
    Array(m)
      .fill(0)
      .map(
        (_, i) =>
          states.filter((states) => states.filter(isMemoryState).length > i)
            .length / states.length
      ),
  ];
};

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
    states.push(
      threads.map((thread) =>
        thread.label ? `${thread.state} (${thread.label})` : thread.state
      )
    );
  };
  const step = () => {
    snapshot();
    threads = threads.map(nextThreadState);
    while (isMemoryTooBusy(threads, m)) {
      const memoryThreads = threads
        .map((t, i) => [t, i])
        .filter(([t, i]) => isMemoryThreadState(t));
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

  const scheduleTask = (time: number, label: string): number => {
    while (threads.every(isBusyThread) || isMemoryBusy(threads, m)) {
      step();
    }
    let threadIndex = threads.findIndex((thread) => !isBusyThread(thread));
    const id = taskId++;
    threads[threadIndex] = setupThread(time, id, label);
    return id;
  };

  const traverseTree = ([currentNode, ...queue]: Tree[]): (Tree & {
    label?: string;
  })[] => {
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
    const nodes = traverseTree([tree]);

    nodes.reverse().forEach((node, index) => {
      if (threads.every(isBusyThread)) {
        while (threads.some(isBusyThread)) {
          step();
        }
      }
      node.label = node.label ?? `${node.name} ${index}`;
      const label = node.label;

      scheduleTask(costTable[node.name] ?? 1, label);
    });
  };

  // const id = processTree(tree);
  processTree(tree);
  // console.dir({ tree }, { depth: null });

  while (threads.some(isBusyThread)) {
    step();
  }
  // if (id) waitTasks([id]);

  return states;
};

export const searchOptimalCommutation = (
  tree: Tree,
  costTable: CostTable,
  n = 2,
  m = 1
): Tree => {
  let currentOptimal = tree;
  let currentOptimalStates = machineStates(currentOptimal, costTable, n, m);
  console.log("currentOptimalStates", currentOptimalStates);

  for (const commutation of generateAllCommutations(tree)) {
    const states = machineStates(commutation, costTable, n, m);
    if (states.length < currentOptimalStates.length) {
      currentOptimal = commutation;
      currentOptimalStates = states;
      const [load, memory] = calculateLoad(states, n, m);
      console.log(stringFromTree(commutation), {
        time: currentOptimalStates.length,
        load,
        memory,
      });
    }
    if (states.length === currentOptimalStates.length) {
      const [load, memory] = calculateLoad(states, n, m);
      const [currentLoad, currentMemory] = calculateLoad(
        currentOptimalStates,
        n,
        m
      );
      if (
        load.every((l, i) => l >= currentLoad[i]) &&
        memory.every((l, i) => l >= currentMemory[i]) &&
        load.some((l, i) => l > currentLoad[i]) &&
        memory.some((l, i) => l > currentMemory[i])
      ) {
        currentOptimal = commutation;
        currentOptimalStates = states;
        console.log(stringFromTree(commutation), {
          time: currentOptimalStates.length,
          load,
          memory,
        });
      }
    }
  }

  return currentOptimal;
};

export const searchOptimalFactorization = (
  tree: Tree,
  costTable: CostTable,
  n = 2,
  m = 1
): Tree => {
  let currentOptimal = tree;
  let currentOptimalStates = machineStates(currentOptimal, costTable, n, m);
  const [load, memory] = calculateLoad(currentOptimalStates, n, m);
  console.log(stringFromTree(currentOptimal), {
    time: currentOptimalStates.length,
    load,
    memory,
  });

  for (const commutation of [...generateAllFactorizations(tree)]) {
    const states = machineStates(commutation, costTable, n, m);
    const [load, memory] = calculateLoad(states, n, m);
    console.log(stringFromTree(commutation), {
      time: currentOptimalStates.length,
      load,
      memory,
    });
    if (states.length < currentOptimalStates.length) {
      currentOptimal = commutation;
      currentOptimalStates = states;
      console.log("better");
    }
    if (states.length === currentOptimalStates.length) {
      const [currentLoad, currentMemory] = calculateLoad(
        currentOptimalStates,
        n,
        m
      );
      const loadSum = load.reduce((acc, l) => acc + l, 0);
      const currentLoadSum = currentLoad.reduce((acc, l) => acc + l, 0);
      const memorySum = memory.reduce((acc, l) => acc + l, 0);
      const currentMemorySum = currentMemory.reduce((acc, l) => acc + l, 0);
      if (loadSum > currentLoadSum && memorySum > currentMemorySum) {
        currentOptimal = commutation;
        currentOptimalStates = states;
        console.log("better");
      }
    }
  }

  return currentOptimal;
};

export const searchOptimalFactorizationCommutation = (
  tree: Tree,
  costTable: CostTable,
  n = 2,
  m = 1,
  count = 1000
): Tree => {
  let currentOptimal = tree;
  let currentOptimalStates = machineStates(currentOptimal, costTable, n, m);
  const [load, memory] = calculateLoad(currentOptimalStates, n, m);
  console.log(stringFromTree(currentOptimal), {
    time: currentOptimalStates.length,
    load,
    memory,
  });

  for (const commutation of [
    ...take(count, generateAllFactorizationCommutations(tree)),
  ]) {
    const states = machineStates(commutation, costTable, n, m);
    const [load, memory] = calculateLoad(states, n, m);
    console.log(stringFromTree(commutation), {
      time: states.length,
      load,
      memory,
    });
    if (states.length < currentOptimalStates.length) {
      currentOptimal = commutation;
      currentOptimalStates = states;
      console.log("better");
    }
    if (states.length === currentOptimalStates.length) {
      const [currentLoad, currentMemory] = calculateLoad(
        currentOptimalStates,
        n,
        m
      );
      const loadSum = load.reduce((acc, l) => acc + l, 0);
      const currentLoadSum = currentLoad.reduce((acc, l) => acc + l, 0);
      const memorySum = memory.reduce((acc, l) => acc + l, 0);
      const currentMemorySum = currentMemory.reduce((acc, l) => acc + l, 0);
      if (loadSum > currentLoadSum && memorySum > currentMemorySum) {
        currentOptimal = commutation;
        currentOptimalStates = states;
        console.log("better");
      }
    }
  }

  return currentOptimal;
};
