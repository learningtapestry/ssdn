import { objectAssign } from "./objectAssign";

describe("objectAssign", () => {
  it("merges objects", () => {
    const mergedObject = objectAssign(
      {},
      { a: 2, b: 2, d: 4 },
      { a: 1, b: 2, c: 3 },
    );
    expect(mergedObject).toEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });
});
