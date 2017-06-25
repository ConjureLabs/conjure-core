module.exports = function sortInsensitive(arr, key) {
  // see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  arr.sort((a, b) => {
    const aVal = key === undefined ? a : a[key];
    const bVal = key === undefined ? b : b[key];

    return aVal.toString().toLowerCase().localeCompare(bVal.toString().toLowerCase());
  });
};
