import Graph from "./Navigator";
import Position from "./Position";
import StackEntry from "./StackEntry";

const mockGraphData = {
  sections: {
    simple: {
      _control: { initialNode: "first" },
      first: {
        name: "first"
      },
      looping: {
        name: "second",
        _control: {
          next: "hasControlBlock",
          loop: { initialNode: "child", collection: "one.two.three" }
        },
        child: {
          name: "child"
        }
      }
    }
  },
  sectionOrdering: ["simple"]
};

const mockGraph = new Graph({ ...mockGraphData });

describe("GraphPosition", () => {
  const singleEntry = new Position({
    parent: mockGraph,
    stack: [new StackEntry({ key: "simple" }), new StackEntry({ key: "first" })]
  });

  const nestedEntry = new Position({
    parent: mockGraph,
    stack: [
      new StackEntry({ key: "simple" }),
      new StackEntry({ key: "looping" }),
      new StackEntry({ key: "child" })
    ]
  });
  describe("activeNode", () => {
    it("References a specific node within the graph", () => {
      expect(singleEntry.activeNode()).toBe(mockGraph.sections.simple.first);
    });
  });

  describe("allNodes", () => {
    it("Returns an array of all graph nodes that comprise this position", () => {
      expect(singleEntry.allNodes()).toEqual([mockGraph.sections.simple.first]);
      expect(nestedEntry.allNodes()).toEqual([
        mockGraph.sections.simple.looping,
        mockGraph.sections.simple.looping.child
      ]);
    });
  });
});
