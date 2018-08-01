import GraphAnalyzer from "./GraphAnalyzer";
import graph from "../samples/react/graph";

/**
 * @file
 * Tests to verify the structure of the graph data.
 * You may want to use similar tests for your own graph data.
 */
describe("React sample graph", () => {
  const analyzer = new GraphAnalyzer({ ...graph, controlKey: "_control" });
  it("has no unreachable nodes", () => {
    const list = analyzer.listUnreachableNodes();
    expect(list).toEqual([]);
  });

  it("has no references to missing nodes", () => {
    const list = analyzer.listBadReferences();
    expect(list).toEqual([]);
  });
});
