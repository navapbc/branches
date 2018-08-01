import get from "./get";

describe("get", () => {
  const mockObj = {
    child: {
      child: {
        property: "thing"
      }
    },
    "-1": -1,
    "0": "zero",
    property: "one",
    false: "false",
    falsy: false,
    alsoFalsy: null,
    notDefined: undefined
  };

  it("returns undefined if the input is undefined", () => {
    expect(get(undefined, "child.property")).toBeUndefined();
  });

  it("returns undefined if the path is undefined", () => {
    expect(get(mockObj, undefined)).toBeUndefined();
  });

  it("returns undefined if the path is null", () => {
    expect(get(mockObj, null)).toBeUndefined();
  });

  it("returns the correct value for zero and false indices", () => {
    expect(get(mockObj, "0")).toBe("zero");
    expect(get(mockObj, "false")).toBe("false");
  });

  it("finds top-level properties", () => {
    expect(get(mockObj, "property")).toBe("one");
  });

  it("returns falsy top-level properties", () => {
    expect(get(mockObj, "falsy")).toBe(false);
    expect(get(mockObj, "alsoFalsy")).toBe(null);
    expect(get(mockObj, "notDefined")).toBe(undefined);
  });

  it("returns nested properties", () => {
    expect(get(mockObj, "child.child.property")).toBe("thing");
  });

  it("returns undefined the property is missing", () => {
    expect(get(mockObj, "absent")).toBe(undefined);
  });

  it("returns undefined if the path is invalid", () => {
    expect(get(mockObj, "child.parent.property")).toBe(undefined);
  });

  it("correctly handles negative numeric indices passed in an array", () => {
    expect(get(mockObj, [-1])).toBe(-1);
  });
});
