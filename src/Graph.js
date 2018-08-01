import StackEntry from "./StackEntry";
import Position from "./Position";
import SpecialCaseNodes from "./SpecialCaseNodes";
import get from "./get";
import isEmpty from "./isEmpty";

/**
 * A graph representation of a branching user flow, with convenience functions for
 * navigating the graph from one position to another.
 *
 * After construction, all operations are stateless and idempotent.
 */
export default class Graph {
  /**
   * @constructor
   *
   * @param {Object} config - graph configuration information
   * @param {Object} config.sections - object describing all sections of the graph
   * @param {string[]} config.sectionOrdering -  a list of keys into the sections, determining which section is first (and which follow).
   * @param {Object} config.filters - map of strings to functions `(state, position) => boolean` used in branching conditions
   * @param {Object} config.collectionFilters - map of strings to functions `(state, entry) => boolean` used in collecting user data
   * @param {string} config.controlKey - string indicating the node property that contains graph control properties (default "_control")
   */
  constructor({
    sections,
    sectionOrdering,
    filters = {},
    collectionFilters = {},
    controlKey = "_control"
  }) {
    this.sections = sections;
    this.sectionOrdering = sectionOrdering;
    this.filters = filters;
    this.collectionFilters = collectionFilters;
    this.controlKey = controlKey;
  }

  /**
   * Returns the initial graph position for the given application state.
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @returns {Position} initial graph position for the given application state state.
   */
  initialPosition(state) {
    const graphPosition = this.createPositionFromURL(state, [this.sectionOrdering[0]]);

    return this._getCurrentOrNextValidPosition(state, graphPosition);
  }

  /**
   * Create a GraphPosition from a url string or array of strings.
   * Delegates nested loop handling to #createPosition.
   *
   * graph.createPositionFromURL(appData, "section/looper/4123/info")
   * graph.createPositionFromURL(appData, ["section", "looper", "4123", "info"])
   *
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {Array|String} urlFragments - a series of strings corresponding to [sectionId, [nodeId, (loopIndex)]...]
   */
  createPositionFromURL(state, urlFragments) {
    if (typeof urlFragments === "string") {
      if (urlFragments[0] === "/") {
        urlFragments = urlFragments.substring(1);
      }
      urlFragments = urlFragments.split("/");
      urlFragments[urlFragments.length - 1] = urlFragments[urlFragments.length - 1]
        .split("?")[0]
        .split("#")[0];
    }
    // the first part of the url is the /{section}
    const stack = [new StackEntry({ key: urlFragments[0] })];
    for (let i = 1; i < urlFragments.length; i += 2) {
      // further portions of url are pairs of /{node}/{index}
      const key = urlFragments[i];
      const activeKey = urlFragments[i + 1];
      stack.push(new StackEntry({ key, activeKey }));
    }
    return this.createPosition(state, stack);
  }

  /**
   * Creates a Position object associated with this graph.
   * Assigns loop collections as needed and ensures the active node is a leaf.
   * Called by #createPositionFromURL.
   * graph.createPosition(userInput, [new StackEntry({ key: "tasks" }), new StackEntry({ key: "tedious" })])
   *
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {Array<StackEntry>} stack - the stack of known nodes at the current position
   */
  createPosition(state, stack = []) {
    const position = new Position({ stack, parent: this });
    let active = position.activeNode();

    while (active) {
      const child = get(active, [this.controlKey, "initialNode"]);
      if (child) {
        position.stack.push(new StackEntry({ key: child }));
        active = position.activeNode();
        continue;
      }
      break;
    }
    if (!active) {
      return Position.empty();
    }

    stack = this._ensureCollections(state, stack);
    return new Position({ parent: this, stack });
  }

  /**
   * Given a position and application state, returns the next position that should be visited.
   * Recurses as needed to find the next appropriate node if the next position is invalid/skipped.
   *
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {Position} current - the position to move from
   */
  nextPosition(state, current) {
    if (current.isEnd()) {
      return current;
    }

    const stack = current.stack.slice(0, current.stack.length - 1);
    const nextNodeId = this._getNextNodeName(state, current);

    if (nextNodeId !== SpecialCaseNodes.NO_ROUTE_FOUND) {
      // the current position specified what is next
      stack.push(new StackEntry({ key: nextNodeId }));
      return this._getCurrentOrNextValidPosition(state, this.createPosition(state, stack));
    }

    // Handle looping over collections
    const top = stack[stack.length - 1];
    if (top && top.collectionKeys) {
      const index = top.collectionKeys.indexOf(top.activeKey);
      if (index < top.collectionKeys.length - 1) {
        // ended a loop iteration
        stack[stack.length - 1] = new StackEntry({
          ...top,
          activeKey: top.collectionKeys[index + 1]
        });
        return this._getCurrentOrNextValidPosition(state, this.createPosition(state, stack));
      }

      // finished a loop collection, proceed to the parent node's next
      return this.nextPosition(
        state,
        new Position({
          parent: this,
          stack: stack
        })
      );
    }

    // Handle moving across sections
    const currentSection = this.sectionOrdering.indexOf(current.sectionKey());
    if (currentSection + 1 < this.sectionOrdering.length) {
      // end of a section; move to next section
      return this._getCurrentOrNextValidPosition(
        state,
        this.createPositionFromURL(state, [this.sectionOrdering[currentSection + 1]])
      );
    }

    // end of the entire graph, or bad route provided; return an empty position
    return new Position({});
  }

  /**
   * Traverse a graph from initial node to end of a sequence, visiting
   * all nodes that are relevant to the provided state.
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {position => boolean} visitor - function receiving each graph position in order; return true to stop iteration
   */
  visitSequence(state, visitor, maxSteps = -1) {
    let position = this.initialPosition(state);
    while (!position.isEnd() && --maxSteps !== 0) {
      if (visitor(position)) {
        break;
      }
      position = this.nextPosition(state, position);
    }
  }

  /**
   * Returns the next valid graph position, either the provided position or one following it.
   * If no position is found, returns the empty graph position.
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {Position} graphPosition - candidate for valid next position
   * @private
   */
  _getCurrentOrNextValidPosition(state, graphPosition) {
    const entryConditions = graphPosition
      .allNodes()
      .map(entry => this.filters[get(entry, [this.controlKey, "condition"])])
      .filter(Boolean);
    const shouldVisit = entryConditions.every(condition => condition(state, graphPosition));

    if (!shouldVisit) {
      // Skip any nodes that don't match entry conditions for the node.
      return this.nextPosition(state, graphPosition);
    }

    const emptyCollections = graphPosition.stack
      .map(entry => entry.collection)
      .filter(c => c && isEmpty(c));
    if (!isEmpty(emptyCollections)) {
      // skip nodes that are looping over empty collections
      return this.nextPosition(state, graphPosition);
    }

    return graphPosition;
  }

  /**
   * Returns the name of the next node, if any.
   * If there is no particular node that should be next, it will return NO_ROUTE_FOUND.
   * @param {Object} state - state object used for comparison in filters
   * @param {Position} current - the position we are moving from
   * @private
   */
  _getNextNodeName(state, current) {
    const next = get(current.activeNode(), [this.controlKey, "next"]);
    if (typeof next === "string") {
      return next;
    }

    if (Array.isArray(next)) {
      const routes = next;
      for (let i = 0; i < routes.length; i += 1) {
        const route = routes[i];
        if (typeof route === "string") {
          return route;
        }
        const filter = this.filters[get(route, "condition")];
        if (filter && filter(state, current)) {
          return get(route, "key") || SpecialCaseNodes.NO_ROUTE_FOUND;
        }
      }
    }

    return SpecialCaseNodes.NO_ROUTE_FOUND;
  }

  /**
   * Returns the filtered collection specified by the given node
   * Returns an array of keys that can be used to look up items
   * in the applicatoin state relevant to the related position.
   *
   * Positions nested inside other loops will search the children of the current?
   * - if specified as a special object?
   * - _control: { nestedLoopCollection: "child.property", loopCollection: "thing.whatever", pageCollection: "stuff" }
   * TODO: rename to be more general
   * @param {Object} state - state object used for comparison in filters and collection key generation
   * @param {Array<String>} nodePath - path to the top-level node whose collection you want to build
   * @private
   */
  getCollectionKeys(state, nodePath) {
    const active = get(this.sections, nodePath);
    const collectionPath = get(active, [this.controlKey, "collectionPath"]);
    const collection = get(state, collectionPath); // TODO: consider making state getter configurable
    const filter =
      this.collectionFilters[get(active, [this.controlKey, "collectionFilter"])] || (() => true);

    const keys = [];
    for (let i in collection) {
      if (filter(state, collection[i])) {
        keys.push(i);
      }
    }
    if (keys.length > 0) {
      return keys;
    }
  }

  /**
   * Adds collection keys and current collection index to an entry
   * @param {Object} state - current user data stored by application where collection is stored
   * @param {Array} stack - stack of StackEntry objects as used by a Position
   * @private
   */
  _ensureCollections(state, stack) {
    const ret = [];
    for (let i = 0; i < stack.length; i += 1) {
      const entry = stack[i];
      const collectionKeys = this.getCollectionKeys(state, stack.slice(0, i + 1).map(e => e.key));
      if (collectionKeys) {
        const activeKey = entry.activeKey || collectionKeys[0];
        ret.push(new StackEntry({ ...entry, collectionKeys, activeKey }));
      } else {
        ret.push(entry);
      }
    }
    return ret;
  }
}
