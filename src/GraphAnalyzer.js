import get from "./get";

/**
 * Analysis tools for ensuring a graph is well-structured.
 * Useful in unit tests to assert that there are no bad references
 * or unreachable nodes within a graph structure.
 */
export default class GraphAnalyzer {
  constructor({ sections, sectionOrdering = [], ignoredProperties = [], controlKey = "_control" }) {
    this.sections = sections;
    this.sectionOrdering = sectionOrdering;
    this.ignoredProperties = new Set(ignoredProperties.concat(controlKey));
    this.controlKey = controlKey;
  }

  /**
   * Returns a list of string paths for every referenced node that is not defined in the graph.
   * Nodes may be referenced in the "sectionList", as "initialNodes", or as "next" nodes.
   * Output paths are of the form: { from: "node.path", to: "missing.node.path" }
   * Use in unit tests to confirm you don't have any bad links defined in your graph.
   *
   * Symmetric to #listUnreachableNodes
   */
  listBadReferences() {
    const references = this._listReferences();
    return references.filter(ref => !get(this.sections, ref.to));
  }

  /**
   * Returns a list of string paths for every unreachable node in graph:
   * those that are defined but not linked to by any other node.
   * Use in unit tests to confirm that you don't have any unreachable content in your graph.
   *
   * You can allow some nodes to be unreachable from the graph by specifying a string path to
   * a property that indicates they are allowed. For example if you link to them from within a page, but
   * don't want to see them as part of the ordinary graph flow.
   * @param {String} params.exceptNodesWithProperty - e.g. "_control.allowUnreachable"
   * Symmetric to #listBadReferences
   */
  listUnreachableNodes({ exceptNodesWithProperty } = {}) {
    const nodePaths = []; // paths to every node that is defined
    const nodeReferences = new Set(this.sectionOrdering); // paths to every node that is referenced by another
    let nodes = Object.keys(this.sections);
    while (nodes.length > 0) {
      const currentPath = nodes.shift();
      const current = get(this.sections, currentPath);
      const initialNodeName = get(current, [this.controlKey, "initialNode"]);
      if (initialNodeName) {
        // there is a reference to that node
        nodeReferences.add(currentPath + "." + initialNodeName);
        // add children to traversal list
        Object.keys(current).forEach(value => {
          if (!this.ignoredProperties.has(value)) {
            const path = currentPath + "." + value;
            nodes.unshift(path);
          }
        });
      }

      // add node to list of found nodes
      nodePaths.push(currentPath);
      const followers = get(current, [this.controlKey, "next"]);
      if (followers) {
        const basePath = currentPath.substring(0, currentPath.lastIndexOf(".")) || currentPath;
        [].concat(followers).forEach(next => {
          if (typeof next === "string") {
            nodeReferences.add(basePath + "." + next);
          } else {
            nodeReferences.add(basePath + "." + next.key);
          }
        });
      }
    }

    return nodePaths.filter(
      node => !nodeReferences.has(node) && !get(this.sections, node + "." + exceptNodesWithProperty)
    );
  }

  /**
   * Lists all the outbound connections defined within the graph.
   * Used internally by #listBadReferences
   */
  _listReferences() {
    const outboundConnections = this.sectionOrdering.map(to => {
      return {
        to,
        from: "sectionOrdering"
      };
    });
    const toVisit = Object.keys(this.sections);
    while (toVisit.length > 0) {
      const currentPath = toVisit.shift();
      const basePath = currentPath.substr(0, currentPath.lastIndexOf(".")) || currentPath;
      const current = get(this.sections, currentPath);
      const initialNodeName = get(current, [this.controlKey, "initialNode"]);
      if (initialNodeName) {
        Object.keys(current).forEach(value => {
          const path = currentPath + "." + value;
          toVisit.unshift(path);
        });

        outboundConnections.push({
          from: currentPath,
          to: currentPath + "." + initialNodeName
        });
      }

      // add connections for each possible next node
      const next = get(current, [this.controlKey, "next"]);
      if (next) {
        [].concat(next).forEach(next => {
          const path = typeof next === "string" ? next : next.key;
          outboundConnections.push({
            to: basePath + "." + path,
            from: currentPath
          });
        });
      }
    }

    return outboundConnections;
  }
}
