const { AccessAnalyzer } = require("aws-sdk");
/**
 * Mapping two objects
 *
 * @param {array} result // Array of object to convert
 * @param {array} fields // Original fields from the array
 * @param {array} requiredFields // Fields that need to e filled 
 * @param {object} appendData // Extra fields if any need to append
 */
function mapData(result, fields, requiredFields, appendData) {
  return result.map((item) => {
    return {
      ...appendData,
      ...fields.reduce((ac, v, i) => {
        return { ...ac, [requiredFields[i]]: `${item[v]}` };
      }, {}),
    };
  });
}
module.exports = mapData;
