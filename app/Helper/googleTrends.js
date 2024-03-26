"use strict";

const googleTrends = require("google-trends-api");
const _ = require("lodash");

/**
 * Getting google trend using the google-trends-api-package
 *
 * @param {string} string // Keyword to get trend
 * @param {Date} startTime // Start date to fetch trend
 * @param {Date} endTime // End date to fetch trend
 */
async function getGoogleTrend(
  keyword,
  startTime = new Date("2021-10-01"),
  endTime = new Date()
) {
  let results = await googleTrends.interestOverTime({
    startTime,
    endTime,
    keyword,
  });
  //Json conversion
  const resultsJSON = JSON.parse(results);
  const data = resultsJSON["default"];
  const timelineData = data["timelineData"];
  return timelineData;
}

module.exports = getGoogleTrend;
