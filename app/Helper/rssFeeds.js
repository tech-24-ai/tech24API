let Parser = require("rss-parser");
let parser = new Parser();

/**
 * Getting google trend using the google-trends-api-package
 *
 * @param {string} string // Keyword to get trend
 * @param {Date} startTime // Start date to fetch trend
 * @param {Date} endTime // End date to fetch trend
 */
async function getRss(url) {
  let feed = await parser.parseURL(url);
  return feed;
}

module.exports = getRss;
