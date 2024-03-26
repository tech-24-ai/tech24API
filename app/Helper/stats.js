const _ = require("lodash");
function getStats(result, key) {
  let output = {};
  result = JSON.parse(JSON.stringify(result));
  let groupByYear = _.groupBy(result, "year");
  let groupByQuarter = Object.keys(groupByYear).reduce(
    (acc, x) => ({
      ...acc,
      [x]: _.groupBy(groupByYear[x], "quarter"),
    }),
    {}
  );
  let yearArr = _.keys(groupByYear).sort().reverse();
  let current_year = yearArr[0];

  let current_quarters = _.keys(groupByQuarter[current_year]).sort().reverse();
  let lastYear = current_year - 1;
  try {
    if (groupByQuarter[lastYear]) {
      if (
        current_quarters[0] !== "ALL" &&
        groupByQuarter[lastYear][current_quarters[0]]
      ) {
        output["3m_growth"] = (
          ((groupByQuarter[current_year][current_quarters[0]][0][key] -
            groupByQuarter[lastYear][current_quarters[0]][0][key]) *
            100) /
          groupByQuarter[lastYear][current_quarters[0]][0][key]
        ).toFixed(2);
      }
    }
  } catch (ex) {
    output["3m_growth"] = 0;
  }
  try {
    if (groupByQuarter[current_year - 1]) {
      let s1 = 0;
      let s2 = 0;
      if (current_quarters[0] === "Q1") {
        s1 =
          parseFloat(
            groupByQuarter[current_year][current_quarters[0]][0][key]
          ) + parseFloat(groupByQuarter[lastYear]["Q4"][0][key]);
        s2 =
          parseFloat(groupByQuarter[lastYear][current_quarters[0]][0][key]) +
          parseFloat(groupByQuarter[lastYear - 1]["Q4"][0][key]);
      } else {
        s1 =
          parseFloat(
            groupByQuarter[current_year][current_quarters[0]][0][key]
          ) +
          parseFloat(groupByQuarter[current_year][current_quarters[1]][0][key]);
        s2 =
          parseFloat(groupByQuarter[lastYear][current_quarters[0]][0][key]) +
          parseFloat(groupByQuarter[lastYear][current_quarters[1]][0][key]);
      }
      output["6m_growth"] = (((s1 - s2) * 100) / s2).toFixed(2);
    }
  } catch (ex) {
    output["6m_growth"] = 0;
  }

  try {
    if (
      groupByQuarter[lastYear] &&
      groupByQuarter[lastYear]["ALL"] &&
      groupByQuarter[lastYear - 1] &&
      groupByQuarter[lastYear - 1]["ALL"]
    ) {
      output["1y_growth"] = (
        ((groupByQuarter[lastYear]["ALL"][0][key] -
          groupByQuarter[lastYear - 1]["ALL"][0][key]) *
          100) /
        groupByQuarter[lastYear - 1]["ALL"][0][key]
      ).toFixed(2);
    }
  } catch (ex) {
    output["1y_growth"] = 0;
  }

  try {
    if (
      groupByQuarter[lastYear] &&
      groupByQuarter[lastYear]["ALL"] &&
      groupByQuarter[lastYear - 2] &&
      groupByQuarter[lastYear - 2]["ALL"]
    ) {
      output["2y_growth"] = (
        ((groupByQuarter[lastYear]["ALL"][0][key] -
          groupByQuarter[lastYear - 2]["ALL"][0][key]) *
          100) /
        groupByQuarter[lastYear - 2]["ALL"][0][key]
      ).toFixed(2);
    }
  } catch (ex) {
    output["2y_growth"] = 0;
  }
  try {
    if (
      groupByQuarter[lastYear] &&
      groupByQuarter[lastYear]["ALL"] &&
      groupByQuarter[lastYear - 3] &&
      groupByQuarter[lastYear - 3]["ALL"]
    ) {
      output["3y_growth"] = (
        ((groupByQuarter[lastYear]["ALL"][0][key] -
          groupByQuarter[lastYear - 3]["ALL"][0][key]) *
          100) /
        groupByQuarter[lastYear - 3]["ALL"][0][key]
      ).toFixed(2);
    }
  } catch (ex) {
    output["3y_growth"] = 0;
  }
  return output;
}

function getStatsForEmployee(result, key) {
  let output = {};
  result = JSON.parse(JSON.stringify(result));
  let sorted_data = _.filter(_.sortBy(result, ["year", "quarter"]), (o) => {
    return o.quarter != "ALL";
  }).reverse();
  try {
    if (sorted_data.length >= 2) {
      output["quarter_growth"] = (
        ((sorted_data[0][key] - sorted_data[1][key]) * 100) /
        sorted_data[1][key]
      ).toFixed(2);
    }
  } catch (ex) {
    output["quarter_growth"] = 0;
  }
  // try {
  //   if (groupByQuarter[current_year - 1]) {
  //     let s1 = 0;
  //     let s2 = 0;
  //     if (current_quarters[0] === "Q1") {
  //       s1 =
  //         parseFloat(
  //           groupByQuarter[current_year][current_quarters[0]][0][key]
  //         ) + parseFloat(groupByQuarter[lastYear]["Q4"][0][key]);
  //       s2 =
  //         parseFloat(groupByQuarter[lastYear][current_quarters[0]][0][key]) +
  //         parseFloat(groupByQuarter[lastYear - 1]["Q4"][0][key]);
  //     } else {
  //       s1 =
  //         parseFloat(
  //           groupByQuarter[current_year][current_quarters[0]][0][key]
  //         ) +
  //         parseFloat(groupByQuarter[current_year][current_quarters[1]][0][key]);
  //       s2 =
  //         parseFloat(groupByQuarter[lastYear][current_quarters[0]][0][key]) +
  //         parseFloat(groupByQuarter[lastYear][current_quarters[1]][0][key]);
  //     }
  //     output["6m_growth"] = (((s1 - s2) * 100) / s2).toFixed(2);
  //   }
  // } catch (ex) {
  //   output["6m_growth"] = 0;
  // }

  try {
    let curr = sorted_data[0];
    let [prev] = _.filter(sorted_data, {
      quarter: curr.quarter,
      year: (sorted_data[0].year - 1).toString(),
    });
    if (curr && prev) {
      output["1y_growth"] = (
        ((curr[key] - prev[key]) * 100) /
        prev[key]
      ).toFixed();
    }
  } catch (ex) {
    output["1y_growth"] = 0;
  }

  try {
    let curr = sorted_data[0];
    let [prev] = _.filter(sorted_data, {
      quarter: curr.quarter,
      year: (sorted_data[0].year - 2).toString(),
    });
    if (curr && prev) {
      output["2y_growth"] = (
        ((curr[key] - prev[key]) * 100) /
        prev[key]
      ).toFixed();
    }
  } catch (ex) {
    output["2y_growth"] = 0;
  }
  try {
    let curr = sorted_data[0];
    let [prev] = _.filter(sorted_data, {
      quarter: curr.quarter,
      year: (sorted_data[0].year - 3).toString(),
    });
    if (curr && prev) {
      output["3y_growth"] = (
        ((curr[key] - prev[key]) * 100) /
        prev[key]
      ).toFixed();
    }
  } catch (ex) {
    output["3y_growth"] = 0;
  }
  return output;
}

function createAll(result, key) {
  let groupByYear = _.groupBy(result, "year");
  Object.keys(groupByYear).forEach((x) => {
    let all = groupByYear[x].find((p) => p.quarter === "ALL");
    if (!all) {
      result.push({
        ...groupByYear[x][0],
        [key]: _.sumBy(groupByYear[x], function (o) {
          return Number(o[key]);
        }),
        quarter: "ALL",
      });
    }
  });
  return result;
}
function formatResponse(stats, result, key) {
  result = JSON.parse(JSON.stringify(result));
  result = createAll(result, key);
  let groupByYear = _.groupBy(result, "year");
  let years = [];
  Object.keys(groupByYear).forEach((year) => {
    years.push(year);
    groupByYear[year] = groupByYear[year].reduce(
      (acc, item) => ({
        ...acc,
        [item.quarter]: item,
      }),
      {}
    );
  });
  years.sort();
  let total = 0;

  let year = years[years.length - 1];
  if (key === "patent_count") {
    year -= 1;
  }
  // if (groupByYear[year]) {
  // if (
  //   !!groupByYear[year] &&
  //   (!groupByYear[year]["ALL"] || Object.keys(groupByYear[year]).length === 1)
  // ) {
  //   year -= 1;
  // }
  // }
  if (groupByYear[year]) {
    total = groupByYear[year]["ALL"]
      ? groupByYear[year]["ALL"][key]
      : (groupByYear[year]["Q1"] ? groupByYear[year]["Q1"][key] : 0) +
        (groupByYear[year]["Q2"] ? groupByYear[year]["Q2"][key] : 0) +
        (groupByYear[year]["Q3"] ? groupByYear[year]["Q3"][key] : 0) +
        (groupByYear[year]["Q4"] ? groupByYear[year]["Q4"][key] : 0);
  }
  groupByYear = _.groupBy(result, "year");
  return {
    total,
    years: years.reverse(),
    ...groupByYear,
    ...stats,
  };
}

function formatMonthlyResponse(data, keys = []) {
  let groupByYear = _.groupBy(data, "year");
  let yearly = {};
  Object.keys(groupByYear).forEach((x) => {
    yearly[x] = {};
    Object.keys(groupByYear[x][0]).forEach((key) => {
      let config = keys.find((k) => k.field == key);
      if (config) {
        yearly[x][key] = Math.round(
          Number(
            _[`${config.action}By`](groupByYear[x], (item) => Number(item[key]))
          )
        );
      }
    });
  });
  return {
    monthly: groupByYear,
    yearly,
    years: Object.keys(groupByYear).sort().reverse(),
  };
}

function getYearQuarter(date) {
  let formatedDate = new Date(date);
  if (
    formatedDate >= new Date(`03-31-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`06-29-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q1",
    };
  } else if (
    formatedDate >= new Date(`06-30-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`09-29-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q2",
    };
  } else if (
    formatedDate >= new Date(`09-30-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`12-30-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q3",
    };
  } else if (
    (formatedDate >= new Date(`12-31-${formatedDate.getFullYear() - 1}`) &&
      formatedDate <= new Date(`03-30-${formatedDate.getFullYear()}`)) ||
    (formatedDate >= new Date(`12-31-${formatedDate.getFullYear()}`) &&
      formatedDate <= new Date(`03-30-${formatedDate.getFullYear() + 1}`))
  ) {
    return {
      year: new Date(date).getFullYear() - 1,
      quarter: "Q4",
    };
  }
}

module.exports = {
  formatResponse,
  getStats,
  getStatsForEmployee,
  formatMonthlyResponse,
  getYearQuarter,
};
