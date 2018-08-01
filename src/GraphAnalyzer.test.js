import GraphAnalyzer from "./GraphAnalyzer";

const mockGraphWithUnreachableNodes = {
  sections: {
    simple: {
      _control: { initialNode: "a" },
      a: { _control: { next: "b" } },
      b: { _control: { next: "c" } },
      c: { _control: { next: "nonexistant" } },
      unreachable: {},
      alsoUnreachableButOkay: { _control: { allowUnreachable: true } }
    },
    collections: {
      _control: { initialNode: "looper" },
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
          name: "loop c",
          _control: {
            next: "missing"
          }
        },
        unreachableLoopNode: {}
      },
      final: {}
    },
    unreachableSection: {
      _control: {
        initialNode: "missing"
      }
    }
  },
  sectionOrdering: ["simple", "collections", "missingSection"]
};

describe("GraphAnalyzer", () => {
  it("can detect unreachable nodes in a graph", () => {
    const analyzer = new GraphAnalyzer({
      ...mockGraphWithUnreachableNodes,
      ignoredProperties: ["_control", "name"]
    });
    const unreachable = analyzer.listUnreachableNodes({
      exceptNodesWithProperty: "_control.allowUnreachable"
    });
    expect(unreachable).toEqual([
      "simple.unreachable",
      "collections.looper.unreachableLoopNode",
      "unreachableSection"
    ]);
  });

  it("can find all connections", () => {
    const analyzer = new GraphAnalyzer({
      ...mockGraphWithUnreachableNodes,
      ignoredProperties: ["_control", "name"]
    });
    const references = analyzer._listReferences();
    expect(references).toContainEqual({ from: "sectionOrdering", to: "simple" });
    expect(references).toContainEqual({ from: "sectionOrdering", to: "missingSection" });
    expect(references).toContainEqual({
      from: "unreachableSection",
      to: "unreachableSection.missing"
    });
    expect(references).toContainEqual({ from: "simple", to: "simple.a" });
    expect(references).toContainEqual({ from: "simple.a", to: "simple.b" });
  });

  it("can find nodes that are referenced but not defined", () => {
    const analyzer = new GraphAnalyzer({
      ...mockGraphWithUnreachableNodes,
      ignoredProperties: ["_control", "name"]
    });
    // const options = analyzer.listPossibleFollowingNodeNames(nodes.start);
    // expect(options).toEqual(['validOption', 'sweet', 'missing']);
    const badReferences = analyzer.listBadReferences();
    expect(badReferences).toContainEqual({ from: "sectionOrdering", to: "missingSection" });
    expect(badReferences).toContainEqual({ from: "simple.c", to: "simple.nonexistant" });
    expect(badReferences).toContainEqual({
      from: "collections.looper.loopEnd",
      to: "collections.looper.missing"
    });
    expect(badReferences).toContainEqual({
      from: "unreachableSection",
      to: "unreachableSection.missing"
    });
  });

  it("respects the controlKey", () => {
    const analyzer = new GraphAnalyzer({
      sections: {
        thing: {
          info: { initialNode: "a" },
          a: {
            info: { next: "b" }
          },
          b: {
            info: { next: "missing" }
          },
          unreachable: {}
        }
      },
      sectionOrdering: ["thing"],
      controlKey: "info"
    });

    expect(analyzer.listBadReferences()).toContainEqual({ from: "thing.b", to: "thing.missing" });
    expect(analyzer.listUnreachableNodes()).toContainEqual("thing.unreachable");
  });
});
