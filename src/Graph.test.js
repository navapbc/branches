import Graph from "./Graph";
import Position from "./Position";
import _StackEntry from "./StackEntry";
import StackEntry from "./StackEntry";

const mockGraphData = {
  sections: {
    simple: {
      _control: { initialNode: "first" },
      first: {
        name: "first",
        _control: { next: "second" }
      },
      second: {
        name: "second",
        _control: { next: "hasControlBlock" }
      },
      hasControlBlock: {
        name: "hasControlBlock",
        _control: { next: "noControlBlock" }
      },
      noControlBlock: { name: "noControlBlock" }
    },
    branching: {
      _control: { initialNode: "truthyEntryCondition" },
      truthyEntryCondition: {
        name: "truthy",
        _control: {
          condition: "alwaysTrue",
          next: "falsyEntryCondition"
        }
      },
      falsyEntryCondition: {
        name: "falsy",
        _control: {
          condition: "alwaysFalse",
          next: "exitsToFirst"
        }
      },
      exitsToFirst: {
        name: "branches-1",
        _control: {
          next: [
            { key: "first", condition: "alwaysTrue" },
            { key: "second", condition: "alwaysTrue" },
            "default"
          ]
        }
      },
      exitsToSecond: {
        name: "branches-2",
        _control: {
          next: [
            { key: "first", condition: "alwaysFalse" },
            { key: "second", condition: "alwaysTrue" },
            "default"
          ]
        }
      },
      exitsToDefault: {
        name: "branches-3",
        _control: {
          next: [
            { key: "first", condition: "alwaysFalse" },
            { key: "second", condition: "alwaysFalse" },
            "default"
          ]
        }
      },
      first: {
        name: "first-but-last"
      }
    },
    collections: {
      _control: {
        initialNode: "array"
      },
      array: {
        name: "array",
        _control: {
          collectionPath: "nestedIterables.array",
          next: "object"
        }
      },
      object: {
        name: "object",
        _control: {
          collectionPath: "nestedIterables.object",
          next: "arrayWithFilter"
        }
      },
      arrayWithFilter: {
        name: "filtered array",
        _control: {
          collectionPath: "nestedIterables.array",
          collectionFilter: "notTwo",
          next: "objectWithFilter"
        }
      },
      objectWithFilter: {
        name: "filtered object",
        _control: {
          collectionPath: "nestedIterables.object",
          collectionFilter: "notTwo",
          next: "looper"
        }
      },
      looper: {
        name: "looper",
        _control: {
          initialNode: "loopStart",
          collectionPath: "nestedIterables.object",
          collectionFilter: "notTwo",
          next: "final"
        },
        loopStart: {
          name: "loop a",
          _control: {
            next: "loopMiddle"
          }
        },
        loopMiddle: {
          name: "loop b",
          _control: {
            next: "loopEnd"
          }
        },
        loopEnd: {
          name: "loop c"
        }
      },
      final: {
        name: "fin"
      }
    }
  },
  sectionOrdering: ["simple", "branching", "collections"]
};

const mockFilters = {
  alwaysTrue: jest.fn(),
  alwaysFalse: jest.fn()
};

mockFilters.alwaysTrue.mockName("Always True");
mockFilters.alwaysFalse.mockName("Always False");
mockFilters.alwaysTrue.mockReturnValue(true);
mockFilters.alwaysFalse.mockReturnValue(false);

const mockCollectionFilters = {
  notTwo: jest.fn()
};

mockCollectionFilters.notTwo.mockImplementation((data, entry) => entry !== 22 && entry !== "two");

const mockApplicationData = {
  nestedIterables: {
    array: ["one", "two", "three"],
    object: { one: 1, two: 22, three: 333 }
  }
};

describe("Graph", () => {
  const graph = new Graph({
    ...mockGraphData,
    filters: mockFilters,
    collectionFilters: mockCollectionFilters
  });

  it("Contains the set of sections to traverse", () => {
    expect(graph.sectionOrdering.length).toBeGreaterThan(0);
    expect(Object.keys(graph.sections).length).toBeGreaterThan(0);
  });

  describe("getCollectionKeys", () => {
    it("returns undefined if there is no collection for the top of the stack", () => {
      expect(graph.getCollectionKeys(mockApplicationData, [""])).toBeUndefined();
      expect(graph.getCollectionKeys(mockApplicationData, ["collections", "none"])).toBeUndefined();
    });

    it("returns an array of object keys that should be iterated", () => {
      // we store the path to the object, so you can use it with
      // immutable data structures and not store stale data
      const arrayKeys = graph.getCollectionKeys(mockApplicationData, ["collections", "array"]);
      expect(arrayKeys).toEqual(Object.keys(mockApplicationData.nestedIterables.array));

      const objectKeys = graph.getCollectionKeys(mockApplicationData, ["collections", "object"]);
      expect(objectKeys).toEqual(Object.keys(mockApplicationData.nestedIterables.object));
    });

    it("filters the set of keys based on the properties of each entry in the collection", () => {
      mockCollectionFilters.notTwo.mockClear();

      const filteredArray = graph.getCollectionKeys(mockApplicationData, [
        "collections",
        "arrayWithFilter"
      ]);
      const filteredObject = graph.getCollectionKeys(mockApplicationData, [
        "collections",
        "objectWithFilter"
      ]);

      expect(filteredArray).toEqual(["0", "2"]);
      expect(filteredObject).toEqual(["one", "three"]);

      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, 1);
      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, 22);
      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, 333);
      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, "one");
      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, "two");
      expect(mockCollectionFilters.notTwo).toHaveBeenCalledWith(mockApplicationData, "three");
    });
  });

  describe("_ensureCollections", () => {
    it("returns a new stack of entries with collection keys added", () => {
      const stack = [new StackEntry({ key: "collections" }), new StackEntry({ key: "array" })];
      const withCollections = graph._ensureCollections(mockApplicationData, stack);

      expect(stack).not.toEqual(withCollections);
      expect(withCollections[withCollections.length - 1]).toHaveProperty("activeKey", "0");
      expect(withCollections[withCollections.length - 1]).toHaveProperty("collectionKeys", [
        "0",
        "1",
        "2"
      ]);
    });
  });

  describe("createPosition", () => {
    it("returns an object that can inspect part of the graph", () => {
      const position = graph.createPosition(mockApplicationData, [
        new StackEntry({ key: "simple" }),
        new StackEntry({ key: "first" })
      ]);
      expect(position.activeNode()).toBe(mockGraphData.sections.simple.first);
      expect(position.activeNode().name).toBe("first");
    });

    it("builds up to a terminal node if the specified stack does not end at a leaf", () => {
      const position = graph.createPosition(mockApplicationData, [
        new StackEntry({ key: "simple" })
      ]);
      expect(position.activeNode()).toBe(mockGraphData.sections.simple.first);
    });

    it("retrieves  up to a terminal node if the specified stack does not end at a leaf", () => {
      const position = graph.createPosition(mockApplicationData, [
        new StackEntry({ key: "simple" })
      ]);
      expect(position.activeNode()).toBe(mockGraphData.sections.simple.first);
    });

    it("assigns collections and default keys at all levels if not specified", () => {
      const unspecified = graph.createPosition(mockApplicationData, [
        new StackEntry({ key: "collections" }),
        new StackEntry({ key: "looper" })
      ]);

      expect(unspecified.stack[1].collectionKeys).toEqual(["one", "three"]);
      expect(unspecified.stack[1].activeKey).toEqual("one");
      expect(unspecified.stack[2]).toBeDefined();
    });

    it("respects assigned collection keys that were provided in input stack", () => {
      const specified = graph.createPosition(mockApplicationData, [
        new StackEntry({ key: "collections" }),
        new StackEntry({ key: "looper", activeKey: "three", collectionKeys: ["5", "3"] })
      ]);

      expect(specified.stack[1].collectionKeys).toEqual(["one", "three"]);
      expect(specified.stack[1].activeKey).toEqual("three");
    });
  });

  describe("createPositionFromURL", () => {
    it("returns an object that can inspect part of the graph", () => {
      const position = graph.createPositionFromURL(mockApplicationData, "simple/first");
      expect(position.activeNode()).toBe(mockGraphData.sections.simple.first);
    });

    it("returns an empty position if the path is not part of the graph", () => {
      const position = graph.createPositionFromURL(mockApplicationData, ["simple", "missing"]);
      expect(position).toEqual(Position.empty());
    });
  });

  describe("nextNodeName", () => {
    it("returns the string key for a given node directly", () => {
      const position = graph.createPositionFromURL(mockApplicationData, "simple/first".split("/"));
      expect(graph._getNextNodeName(mockApplicationData, position)).toBe("second");
    });

    it("calls filter functions with the given application state and the exiting position", () => {
      mockFilters.alwaysTrue.mockClear();
      mockFilters.alwaysFalse.mockClear();
      const position = graph.createPositionFromURL(
        mockApplicationData,
        "branching/exitsToFirst".split("/")
      );
      graph._getNextNodeName(mockApplicationData, position);
      expect(mockFilters.alwaysTrue).toHaveBeenCalledTimes(1);
      expect(mockFilters.alwaysTrue).toHaveBeenCalledWith(mockApplicationData, position);
    });

    it("returns the first item in an array", () => {
      const position = graph.createPositionFromURL(mockApplicationData, "branching/exitsToFirst");
      expect(graph._getNextNodeName(mockApplicationData, position)).toBe("first");
    });

    it("returns the first item not to fail its condition in an array", () => {
      const position = graph.createPositionFromURL(mockApplicationData, "branching/exitsToSecond");
      expect(graph._getNextNodeName(mockApplicationData, position)).toBe("second");
    });

    it("treats array entries without a condition as passing", () => {
      const position = graph.createPositionFromURL(mockApplicationData, "branching/exitsToDefault");
      expect(graph._getNextNodeName(mockApplicationData, position)).toBe("default");
    });
  });

  describe("initialPosition", () => {
    it("returns a graph position referencing the first node in the first section", () => {
      expect(graph.initialPosition(mockApplicationData)).toEqual(
        new Position({
          parent: graph,
          stack: [new _StackEntry({ key: "simple" }), new _StackEntry({ key: "first" })]
        })
      );
    });
  });

  describe("nextValidPosition", () => {
    it("skips over nodes that have failing conditions (in their _control.condition)", () => {
      const start = graph.createPositionFromURL(
        mockApplicationData,
        "branching/truthyEntryCondition"
      );
      expect(graph._getNextNodeName(mockApplicationData, start)).toBe("falsyEntryCondition");
      expect(graph.nextPosition(mockApplicationData, start).activeNode().name).not.toBe(
        "falsyEntryCondition"
      );
    });

    it("returns an empty position object when there is no next node to navigate to", () => {
      const start = graph.createPositionFromURL(mockApplicationData, "branching/exitsToDefault");
      expect(graph._getNextNodeName(mockApplicationData, start)).toBe("default");
      expect(graph.nextPosition(mockApplicationData, start).isEnd()).toBe(true);
    });

    it("skips looping nodes that have a missing or empty collection", () => {});
  });

  describe("visitSequence", () => {
    // let collectionEntries = [];
    // const entry = position.activeCollectionEntry();
    // if (entry) {
    //   collectionEntries.push(entry);
    // }

    it("steps through every node that should be visited across the entire graph", () => {
      const sequence = [];
      graph.visitSequence(mockApplicationData, position => {
        sequence.push(position.activeNode().name);
        const activeKey = position.activeCollectionKey();
        if (activeKey) {
          sequence.push(activeKey);
        }
        return false; // not done
      });

      expect(sequence).toEqual([
        "first",
        "second",
        "hasControlBlock",
        "noControlBlock",
        "truthy",
        "branches-1",
        "first-but-last",
        "array",
        "0",
        "object",
        "one",
        "filtered array",
        "0",
        "filtered object",
        "one",
        // first pass through loop
        "loop a",
        "one",
        "loop b",
        "one",
        "loop c",
        "one",
        // second pass through loop
        "loop a",
        "three",
        "loop b",
        "three",
        "loop c",
        "three",
        // exit loop
        "fin"
      ]);
    });

    it("stops iteration when the visitor function returns true (done)", () => {
      const sequence = [];
      graph.visitSequence(mockApplicationData, position => {
        sequence.push(position.activeNode().name);
        return true;
      });
      expect(sequence.length).toBe(1);
    });

    it("respects the controlKey parameter", () => {
      const graph = new Graph({
        sections: {
          thing: {
            info: { initialNode: "a" },
            a: {
              name: "a",
              info: { next: "b" }
            },
            b: {
              name: "b",
              info: { next: "missing" }
            },
            unreachable: {}
          }
        },
        sectionOrdering: ["thing"],
        controlKey: "info"
      });

      const sequence = [];
      graph.visitSequence(mockApplicationData, position => {
        sequence.push(position.activeNode().name);
      });
      expect(sequence).toEqual(["a", "b"]);
    });
  });
});
