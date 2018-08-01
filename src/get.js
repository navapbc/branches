/**
 * Returns a top-level or nested property of an object.
 * If the property is missing, returns undefined.
 * @param {Object} obj - javascript object to get child property of
 * @param {String | Array<String>} propertyPath - path to desired property
 */
export const get = (obj, propertyPath) => {
  if (typeof propertyPath === "string") {
    propertyPath = propertyPath.split(".");
  }

  if (Array.isArray(propertyPath)) {
    return propertyPath.reduce((object, key) => {
      if (object) {
        return object[key];
      }
      return undefined;
    }, obj);
  }
  return undefined;
};

export default get;
