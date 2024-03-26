const axios = use("axios");
const { API_TYPE, URLS, KEYS } = require("../Helper/constants");
const logger = require("../Helper/logger");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");

const LoggerDebug = use("Logger");

const convert = require("xml-js");
const _ = require("lodash");
var is_cron_job = false;

const VendorWebTraffics = use(
  "App/Models/Admin/VendorModule/VendorWebTraffics"
);

async function makeAlexaApiCall(date, Url, options) {
  const url = URLS.WEB_TRAFFIC_URL;
  let apikey = await Config.findOrCreate(
    { key: KEYS.ALEXA_KEY },
    { key: KEYS.ALEXA_KEY, value: "demo" }
  );
  let params = {
    ...options,
    Url,
    Start: `${date.format("YYYYMMDD")}`,
    Range: date.daysInMonth(),
  };
  let headers = {
    "x-api-key": apikey.value,
  };

  const result = await axios.get(url, { params, headers });

  return result;
}
async function processWebTrafficData(result, date, rank) {
  if (!(result instanceof Array)) result = [result];
  let output = result.map((item) => {
    return {
      page_view_per_million: parseFloat(item["PageViews"]["PerMillion"]._text),
      page_view_per_user: parseFloat(item["PageViews"]["PerUser"]._text),
      web_ranking: Number(rank),
      reach_per_million: parseFloat(item["Reach"]["PerMillion"]._text),
    };
  });
  let finalData = {
    page_view_per_million: Math.round(
      _.meanBy(output, "page_view_per_million")
    ),
    page_view_per_user: Math.round(_.meanBy(output, "page_view_per_user")),
    web_ranking: Math.round(_.meanBy(output, "web_ranking")),
    reach_per_million: Math.round(_.meanBy(output, "reach_per_million")),
    year: date.year(),
    month_id: date.month(),
    month: date.format("MMM").toUpperCase(),
  };
  return finalData;
}
async function fetchWebTraffic(vendorDetails, date) {
  let currentDate = moment();
  let resposnse = false;
  let rank = 0;
  {
    let info = await makeAlexaApiCall(date, vendorDetails.website, {
      Action: "UrlInfo",
      ResponseGroup: "Rank",
    });
    let { Awis } = convert.xml2js(info.data, {
      compact: true,
      spaces: 0,
    });
    rank = Awis.Results.Result.Alexa.TrafficData.Rank._text;
    if(rank == 'NaN' || rank == 'null' || rank == '' || rank < 0){
      rank = 0;
    }

  }

  if(!(rank && rank >= 0)){
    rank = 0;
  }

  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Rank ${rank}`);
  while (currentDate.diff(date, "M") >= 1) {
    
    let response = await makeAlexaApiCall(date, vendorDetails.website, {
      Action: "TrafficHistory",
      ResponseGroup: "History",
    });

    var { Awis } = convert.xml2js(response.data, {
      compact: true,
      spaces: 0,
    });
    if (Awis.Results.Result.Alexa.TrafficHistory.HistoricalData.Data) {
      resposnse = true;
      let finalData = await processWebTrafficData(
        Awis.Results.Result.Alexa.TrafficHistory.HistoricalData.Data,
        date,
        rank
      );
      if(is_cron_job) LoggerDebug.transport("cronfile").info(`Traffic Date ${date}`);
      if(is_cron_job) LoggerDebug.transport("cronfile").info(`Traffic Data ${finalData.length}`);
      await VendorWebTraffics.findOrCreate(
        {
          year: finalData.year,
          month: finalData.month,
          vendor_id: vendorDetails.id,
        },
        { ...finalData, vendor_id: vendorDetails.id, is_api_extracted: true }
      );
    }
    date.add(1, "M");
  }
  return resposnse;
}
// Update Vendor Patent counts
async function updateWebTraffic(vendor_id, auth) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  if (!vendorDetails.website) throw new Error("Website Link not specified");
  let date = moment().subtract(1, 'y');
  const query = VendorWebTraffics.query();
  const result = await query
    .where({ vendor_id: vendorDetails.id })
    .orderBy("year", "desc")
    .orderBy("month_id", "desc")
    .limit(1)
    .fetch();
  //logging
  logger.logApi(API_TYPE.WEB_TRAFFIC, vendor_id, auth.user.id);

  if (result) {
    if (result.rows[0]) {
      date = moment();
      
      let lastDate = moment(
        `${result.rows[0].year}-${moment()
          .month(result.rows[0].month)
          .format("M")}-01`,
        "YYYY-M-D"
      );
      //lastDate.add(1, "M");
      
      let datediff = date.diff(lastDate, "M");
      
      if (datediff < 1 && datediff > 0) {
        return false;
      } else {
        date = lastDate;
      }
    }
  }
  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Last Date ${date}`);
  const res = await fetchWebTraffic(vendorDetails, date);

  return res;
}

async function updateAllWebTraffic() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();
  query.whereNot("website", "");
  query.whereNot("website", null);
  var curyear = moment().format('YYYY');
  var lastyear = moment().subtract(1, "year").format('YYYY');
  
  var lastmonth = (moment().subtract(1, "month").format('MMM')).toUpperCase();
  
  //Query to check last month data is present, if yes then don't fetch data
  if (lastmonth == "DEC") {
    query.with("webtraffics", (builder) => {
      builder.whereRaw('year = (?) and month = (?)', [lastyear, lastmonth]);
    });
  } else {
    query.with("webtraffics", (builder) => {
      builder.whereRaw('year = (?) and month = (?)', [curyear, lastmonth]);
    });
  }
  const data = (await query.fetch()).toJSON();

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor ${element.name}`);

    if (element.webtraffics && element.webtraffics.length > 0) {
      if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Web traffic Details Updated ${element.webtraffics.length}`);
      continue;
    } else {

      try {
        await updateWebTraffic(element.id, {
          user: {
            id: null,
          },
        });
      } catch (ex) {
        error_message.push({
          vendor_id: element.id,
          message: ex.message,
        });
        if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Error ${JSON.stringify(error_message)}`);
      } finally {
        await new Promise((res, rej) => {
          setTimeout(() => {
            res(true);
          }, 1000 * 60 * 1);
        });
      }
    }
  }
  return error_message;
}

module.exports = { updateAllWebTraffic, updateWebTraffic };
