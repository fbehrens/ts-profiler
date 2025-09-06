import { describe, test, expect } from "vitest";
import * as pl from "nodejs-polars";

describe("polars", () => {
  test("series", () => {
    const s = pl.Series([1, 2, 3]);
    expect(s.slice(1, s.length).toArray()).toEqual([2, 3]);
  });
});
