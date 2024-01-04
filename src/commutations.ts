import { patternMatcher, patternMatcherDict } from "./optimizer";
import { Tree, product, product2, product3 } from "./utils";

export function* generateAllCommutations(item: Tree): Generator<Tree, any, undefined> {
  if (patternMatcher("_ + _", item) || patternMatcher("_ * _", item)) {
    const [a, b] = item.children!;
    const aCommutations = [...generateAllCommutations(a)];
    const bCommutations = [...generateAllCommutations(b)];

    for (const [a, b] of product2(aCommutations, bCommutations)) {
      yield { ...item, children: [a, b] };
      yield { ...item, children: [b, a] };
    }

    return;
  }

  if (patternMatcher("(_ - _) - _", item)) {
    const { a, b, c } = patternMatcherDict("(a - b) - c", item);
    const aCommutations = generateAllCommutations(a);
    const bCommutations = generateAllCommutations(b);
    const cCommutations = generateAllCommutations(c);

    for (const [a, b, c] of product3(aCommutations, bCommutations, cCommutations)) {
      const negB = { name: "neg", children: [b] };
      const negC = { name: "neg", children: [c] };

      yield { name: "-", children: [{ name: "-", children: [a, b] }, c] };
      yield { name: "-", children: [{ name: "-", children: [a, c] }, b] };
      yield { name: "-", children: [{ name: "+", children: [negB, a] }, c] };
      yield { name: "+", children: [{ name: "-", children: [negB, c] }, a] };
      yield { name: "+", children: [{ name: "-", children: [negC, b] }, a] };
      yield { name: "-", children: [{ name: "+", children: [negC, a] }, b] };
    }
    return;
  }

  if (patternMatcher("(_ / _) / _", item)) {
    const { a, b, c } = patternMatcherDict("(a / b) / c", item);
    const aCommutations = generateAllCommutations(a);
    const bCommutations = generateAllCommutations(b);
    const cCommutations = generateAllCommutations(c);

    for (const [a, b, c] of product3(aCommutations, bCommutations, cCommutations)) {
      const invB = { name: "/", children: [{ name: "1", type: "num" }, b] };
      const invC = { name: "/", children: [{ name: "1", type: "num" }, c] };

      yield { name: "/", children: [{ name: "/", children: [a, b] }, c] };
      yield { name: "/", children: [{ name: "/", children: [a, c] }, b] };
      yield { name: "/", children: [{ name: "*", children: [invB, a] }, c] };
      yield { name: "*", children: [{ name: "/", children: [invB, c] }, a] };
      yield { name: "*", children: [{ name: "/", children: [invC, b] }, a] };
      yield { name: "/", children: [{ name: "*", children: [invC, a] }, b] };
    }
    return;
  }

  if (patternMatcher("_ - (_ - _)", item)) {
    const { a, b, c } = patternMatcherDict("a - (b - c)", item);
    const aCommutations = generateAllCommutations(a);
    const bCommutations = generateAllCommutations(b);
    const cCommutations = generateAllCommutations(c);

    for (const [a, b, c] of product3(aCommutations, bCommutations, cCommutations)) {
      const negB = { name: "neg", children: [b] };

      yield { name: "-", children: [a, { name: "-", children: [b, c] }] };
      yield { name: "+", children: [a, { name: "-", children: [c, b] }] };
      yield { name: "+", children: [negB, { name: "+", children: [a, c] }] };
      yield { name: "+", children: [negB, { name: "+", children: [c, a] }] };
      yield { name: "-", children: [c, { name: "-", children: [b, a] }] };
      yield { name: "+", children: [c, { name: "-", children: [a, b] }] };
    }

    return;
  }

  if (patternMatcher("_ / (_ / _)", item)) {
    const { a, b, c } = patternMatcherDict("a / (b / c)", item);
    const aCommutations = generateAllCommutations(a);
    const bCommutations = generateAllCommutations(b);
    const cCommutations = generateAllCommutations(c);

    for (const [a, b, c] of product3(aCommutations, bCommutations, cCommutations)) {
      const invB = { name: "/", children: [{ name: "1", type: "num" }, b] };
      yield { name: "/", children: [a, { name: "/", children: [b, c] }] };
      yield { name: "*", children: [a, { name: "/", children: [c, b] }] };
      yield { name: "*", children: [invB, { name: "*", children: [a, c] }] };
      yield { name: "*", children: [invB, { name: "*", children: [c, a] }] };
      yield { name: "/", children: [c, { name: "/", children: [b, a] }] };
      yield { name: "*", children: [c, { name: "/", children: [a, b] }] };
    }

    return;
  }

  if (item.children) {
    for (const children of product(...item.children.map(generateAllCommutations))) {
      yield { ...item, children };
    }
  } else yield item;
}
