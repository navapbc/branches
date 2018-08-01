/**
 * Returns true if the collection contains no entries.
 * @param {Array|Object} collection
 */
export const isEmpty = collection => {
  if (!collection) {
    return false;
  }
  if (collection.length !== undefined) {
    return collection.length === 0;
  }
  if (collection.size !== undefined) {
    return collection.size === 0;
  }
  return Object.keys(collection).length === 0;
};

export default isEmpty;
