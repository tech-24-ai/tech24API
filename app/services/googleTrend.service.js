const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const VendorGoogleTrends = use(
  "App/Models/Admin/VendorModule/VendorGoogleTrends"
);
const _googleTrends = require("../Helper/googleTrends");

const _mapData = require("../Helper/mapper");
const { API_TYPE } = require("../Helper/constants");
const logger = require("../Helper/logger");
const LoggerDebug = use("Logger");
const moment = require("moment");
var is_cron_job = false;

//Formatting trends data to save in database
function formatTrendData(trends) {
  return trends.map((x) => ({
    ...x,
    date: moment(new Date(x.date)).format("YYYY-MM-DD"),
    year: new Date(x.date).getFullYear(),
  }));
}

// Update trend for single vendor
async function updateVendorTrend(vendor_id, auth) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  logger.logApi(API_TYPE.GOOGLE_TRENDS, vendor_id, auth.user.id);
  const query = VendorGoogleTrends.query();
  const result = await query
    .where({ vendor_id: vendor_id })
    .orderBy("date", "desc")
    .limit(1)
    .fetch();
  let trends = [];
  if (!vendorDetails.name) return;
  if (result.rows.length) {
    let startD = new Date(result.rows[0].date);
    startD.setDate(startD.getDate() + 1);
    trends = await _googleTrends(vendorDetails.name, new Date(startD));
  } else {
    trends = await _googleTrends(vendorDetails.name);
  }
  if (trends.length) {
    trends = _mapData(
      trends,
      ["formattedTime", "value"],
      ["date", "trends_score"],
      {
        vendor_id,
        is_api_extracted: true,
      }
    );
    trends = formatTrendData(trends);
    for (let index = 0; index < trends.length; index++) {
      var element = trends[index];
      
      await VendorGoogleTrends.findOrCreate(
        {
          vendor_id,
          date: element.date,
          year: element.year,
        },
        element
      );
    }
    //VendorGoogleTrends.createMany(trends);
  }
  
  if(is_cron_job) LoggerDebug.transport("cronfile").info(
    `Google Trends Data: ${trends.length}`
  );
  return trends;
}
async function updateAllVendorTrend() {
  let error_message = [];
  const query = Vendor.query();
  is_cron_job = true;
  query.whereNot("name", "");
  query.whereNot("name", null);
  var curyear = moment().format('YYYY');
  var lastyear = moment().subtract(1, "year").format('YYYY');

  var lastday = moment().subtract(2, "days").format('yyyy-MM-DD');;
  
  //Query to check last month data is present, if yes then don't fetch data
  if (lastday == (lastyear + "-12-31")) {
    query.with("googletrends", (builder) => {
      builder.whereRaw('year = (?) and date = (?)', [lastyear, lastday]);
    });
  } else {
    query.with("googletrends", (builder) => {
      builder.whereRaw('year = (?) and date = (?)', [curyear, lastday]);
    });
  }

  const data = (await query.fetch()).toJSON();

  for (let index = 0; index < data.length; index++) {
    const element = data[index];

    
    if(is_cron_job) LoggerDebug.transport("cronfile").info(
      `Google Trends: ${element.name}`
    );
    if (element.googletrends && element.googletrends.length > 0) {
      if(is_cron_job) LoggerDebug.transport("cronfile").info(
        `Latest Trends Available, skipping...`
      );
      continue;
    } else {
      if(is_cron_job) LoggerDebug.transport("cronfile").info(
        `Fetching Latest Trends...`
      );
      try {
        await updateVendorTrend(element.id, {
          user: {
            id: null,
          },
        });
      } catch (ex) {
        error_message.push({
          vendor_id: element.id,
          message: ex.message,
        });
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
module.exports = { updateAllVendorTrend, updateVendorTrend };
