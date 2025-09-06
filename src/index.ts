import { Chunk } from "effect";
import * as pl from "nodejs-polars";
type Algo<T> = {
  name: string;
  create(a: number[]): T;
  queue(n: number, q: T): T;
};

const naive: Algo<number[]> = {
  name: "naive",
  create(arr) {
    return arr;
  },
  queue(n, arr) {
    arr.push(n);
    const _ = arr.shift();
    return arr;
  },
};
const chunk: Algo<Chunk.Chunk<number>> = {
  name: "chunk",
  create(arr) {
    return Chunk.fromIterable(arr);
  },
  queue(n, arr) {
    const chunk = Chunk.appendAll(arr, Chunk.make(n));
    return Chunk.drop(chunk, 1);
  },
};
const polars: Algo<pl.Series> = {
  name: "polars",
  create(arr) {
    return pl.Series(arr);
  },
  queue(n, arr) {
    arr.append(pl.Series([n]));
    return arr.slice(1, arr.length);
  },
};

function createInitialArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

function profileArrayOperations<T>({
  algo,
  iterations,
  arraySize = 1000,
}: {
  algo: Algo<T>;
  iterations: number;
  arraySize?: number;
}) {
  let q = algo.create(createInitialArray(arraySize));
  for (let i = 0; i < 100; i++) {
    q = algo.queue(i, q);
  }
  q = algo.create(createInitialArray(arraySize));
  const startTime = performance.now();
  const initialMemory = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    q = algo.queue(i, q);
  }

  const endTime = performance.now();
  const finalMemory = process.memoryUsage();

  const totalTime = endTime - startTime;
  const totalMemory =
    (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
  const avgTime = totalTime / iterations;

  return {
    algo: algo.name,
    iterations,
    "Total(ms)": Number(totalTime.toFixed(3)),
    "Average(ms)": Number(avgTime.toFixed(6)),
    "Ops/s": Number((1000 / avgTime).toFixed(0)),
    "Mem(MB)": Number(totalMemory.toFixed(2)),
  };
}

// const algos = [naive, chunk, polars] as const;

// const run = <T>(algo: Algo<T>) =>
//   [1000].map((iterations) => profileArrayOperations({ algo, iterations }));
// const result = [...run(naive), ...run(chunk), ...run(polars)];

const runAll = (algos: Algo<unknown>[], iterationsList: number[]) =>
  algos.flatMap((algo) =>
    iterationsList.map((iterations) =>
      profileArrayOperations({ algo, iterations })
    )
  );

const result = runAll([naive, chunk, polars], [1000]);

console.table(result);
