import { calculateLoad, machineStates } from "./machine";
import { generateAllFactorizationCommutationsAssociations2 } from "./optimizer";
import { stringFromTree } from "./tree";
import { CostTable } from "./types";
import { Tree, take } from "./utils";

export const searchOptimalFactorizationCommutationAssociations = (
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

  for (const commutation of [...take(count, generateAllFactorizationCommutationsAssociations2(tree))]) {
    const states = machineStates(commutation, costTable, n, m);
    const [load, memory] = calculateLoad(states, n, m);
    // console.log(stringFromTree(commutation), {
    //   time: states.length,
    //   load,
    //   memory,
    // });
    if (states.length < currentOptimalStates.length) {
      currentOptimal = commutation;
      currentOptimalStates = states;
      console.log(stringFromTree(commutation), {
        time: states.length,
        load,
        memory,
      });
      // console.log("better");
    }
    if (states.length === currentOptimalStates.length) {
      const [currentLoad, currentMemory] = calculateLoad(currentOptimalStates, n, m);
      const loadSum = load.reduce((acc, l) => acc + l, 0);
      const currentLoadSum = currentLoad.reduce((acc, l) => acc + l, 0);
      const memorySum = memory.reduce((acc, l) => acc + l, 0);
      const currentMemorySum = currentMemory.reduce((acc, l) => acc + l, 0);
      if (loadSum > currentLoadSum && memorySum > currentMemorySum) {
        currentOptimal = commutation;
        currentOptimalStates = states;
        console.log(stringFromTree(commutation), {
          time: states.length,
          load,
          memory,
        });
        // console.log("better");
      }
    }
  }

  return currentOptimal;
};
