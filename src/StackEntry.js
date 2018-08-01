/**
 * A small data type for storing the information used by graph Positions.
 */
export default class StackEntry {
  constructor({ key = null, collectionKeys = null, activeKey = null }) {
    this.key = key;
    this.collectionKeys = collectionKeys;
    this.activeKey = activeKey;
  }
}
