import get from "./get";

/**
 * Stores information about a position within a flow control graph.
 * Its properties correspond to a url location of the form:
 * `/app/[section]/[node]/(loopKey)/(loopedNode)/`
 *
 * Implementation: a stack of StackEntries lets us keep track of where data lives,
 * we can look that data up within the parent graph data structure.
 * Public functions read the data out.
 *
 * Looping over questions:
 * [{}, {collection}, {looped-thing}]
 * Question with many pieces of data:
 * [{}, {collection, question}]
 */
export default class Position {
  /**
   *
   * @param {Navigator} parent - the parent Navigator that generated this position
   * @param {Array<StackEntry>} url - url identifying this graph position
   */
  constructor({ stack = [], parent }) {
    this.stack = stack;
    this.parent = parent;
  }

  /**
   * Returns an empty graph position
   */
  static empty() {
    return new Position({});
  }

  isEnd() {
    return this.stack.length === 0;
  }

  /**
   * Returns the top-level node that this position represents.
   * Most precise picture of where we are.
   */
  activeNode() {
    if (!this.isEnd()) {
      return get(this.parent.sections, this.stack.map(entry => entry.key));
    }
  }

  /**
   * Returns an array of all the nodes in this position's stack.
   * In the array, later entries are nodes nested within earlier entries.
   * Most complete picture of where we are.
   */
  allNodes() {
    const list = [];
    for (let i = 1; i < this.stack.length; i += 1) {
      const path = this.stack.slice(0, i + 1).map(entry => entry.key);
      list.push(get(this.parent.sections, path));
    }
    return list;
  }

  allCollectionKeys() {
    const keys = [];
    for (let i = 1; i < this.stack.length; i += 1) {
      if (this.stack[i].activeKey) {
        keys.push(this.stack[i].activeKey);
      }
    }
    return keys;
  }

  activeCollectionKey() {
    const keys = this.allCollectionKeys();
    return keys[keys.length - 1];
  }

  /**
   * Returns the key for the position's section, if any.
   * Used when navigating from one section to another.
   */
  sectionKey() {
    if (!this.isEnd()) {
      return this.stack[0].key;
    }
  }

  /**
   * Returns a url representation of this graph position.
   */
  toURL() {
    if (this.isEnd()) {
      return "";
    }
    let sep = "";
    return this.stack.reduce((url, entry) => {
      url = url + sep + entry.key;
      if (entry.activeCollectionKey !== undefined) {
        url += sep + entry.activeCollectionKey;
      }
      sep = "/";
      return url;
    }, "");
  }
}
