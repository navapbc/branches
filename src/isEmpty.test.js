import isEmpty from "./isEmpty";
describe("isEmpty", () => {
  it("returns true for empty arrays and objects", () => {
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(new Set())).toBe(true);
    expect(isEmpty(new Map())).toBe(true);
  });
  it("returns false for objects and arrays with at least one property", () => {
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: "value" })).toBe(false);
    expect(isEmpty(new Set("hello"))).toBe(false);
    expect(isEmpty(new Map([["key", "value"]]))).toBe(false);
  });
  it("is safe to call with undefined values", () => {
    expect(() => {
      isEmpty(undefined);
    }).not.toThrow();
  });
});
