const axios = use("axios");
const _mapData = require("../Helper/mapper");
const { API_TYPE, URLS, KEYS } = require("../Helper/constants");
const logger = require("../Helper/logger");
const LoggerDebug = use("Logger");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");
const _ = require("lodash");

var is_cron_job = false;
const VendorTwitterDatas = use(
  "App/Models/Admin/VendorModule/VendorTwitterDatas"
);
const VendorTwitterMention = use(
  "App/Models/Admin/VendorModule/VendorTwitterMention"
);
function getISOString(date) {
  return `${date.format("YYYY-MM-DDTHH:mm:ss.000")}Z`;
}
async function makeTwitterCall(authToken, url, params = {}) {
  let headers = {
    Authorization: authToken.value,
  };
  return axios.get(url, { headers, params });
}

async function fetchTwitterUserDetails(authToken, twitter_handle) {
  let params = {
    "user.fields": "public_metrics",
  };
  let { data } = await makeTwitterCall(
    authToken,
    `${URLS.TWITTER_URL_V2}users/by/username/${twitter_handle}`,
    params
  );

  if (data.data) {
    return data.data;
  } else {
    throw new Error("Handler Name Invalid");
  }
}

async function fetchUserMentions(authToken, vendorDetails, user_details) {
  let loop = true;
  let pagination_token = "";
  const query = VendorTwitterMention.query();
  const result = await query
    .where({ vendor_id: vendorDetails.id })
    .orderBy("last_mention_date", "desc")
    .limit(1)
    .fetch();

  let lastDate = moment("2021-05-01");
  if (result.rows[0]) {
    lastDate = moment(result.rows[0].last_mention_date, moment.ISO_8601).add(
      1,
      "second"
    );
  }

  let current_date = moment();
  while (lastDate < current_date) {
    let totalMentions = [];
    loop = true;
    let params = {
      "tweet.fields": "created_at",
      "poll.fields": "end_datetime",
      max_results: 100,
      start_time: getISOString(lastDate),
      end_time: getISOString(lastDate.endOf("month")),
    };
    while (loop) {
      if (pagination_token) params.pagination_token = pagination_token;

      let { data } = await makeTwitterCall(
        authToken,
        `${URLS.TWITTER_URL_V2}users/${user_details.id}/mentions`,
        params
      );

      if (!data.data) {
        loop = false;
      } else {
        totalMentions.push(...data.data);
        if (data.meta.next_token && data.meta.result_count == 100) {
          pagination_token = data.meta.next_token;
        } else {
          loop = false;
        }
      }
    }

    if(is_cron_job) LoggerDebug.transport("cronfile").info(
      `Mention received : ${totalMentions.length} and ${lastDate}`
    );
    if (totalMentions.length) {
      let final_data = {
        year: lastDate.year(),
        month: lastDate.format("MMM").toUpperCase(),
        vendor_id: vendorDetails.id,
        mention_count: totalMentions.length,
        last_mention_date: totalMentions[0].created_at,
        is_api_extracted: true,
      };

      let data = await VendorTwitterMention.findOrCreate(
        {
          year: final_data.year,
          month: final_data.month,
          vendor_id: final_data.vendor_id,
        },
        final_data
      );
      if (final_data.mention_count != data.mention_count) {
        data.mention_count += final_data.mention_count;
        data.last_mention_date = totalMentions[0].created_at;
        await data.save();
      }
    }
    lastDate = lastDate.add(1, "d");

  }
  return true;
}

async function fetchUserTweets(authToken, user_details, date) {

  const finaldate = date.clone();
  const starttime = getISOString(finaldate.startOf("month"));
  const endtime = getISOString(finaldate.endOf("month"));
  let totalTweets = [];
  let loop = true;
  let pagination_token = "";
  while (loop) {
    let params = {
      max_results: 100,
      start_time: starttime,
      end_time: endtime,
      "tweet.fields": "public_metrics",
    };
    if (pagination_token) params.pagination_token = pagination_token;
    let { data } = await makeTwitterCall(
      authToken,
      `${URLS.TWITTER_URL_V2}users/${user_details.id}/tweets`,
      params
    );
    if (!data.data) {
      loop = false;
    } else {
      totalTweets.push(...data.data);
      if (data.meta.next_token && data.meta.result_count == 100) {
        pagination_token = data.meta.next_token;
      } else {
        loop = false;
      }
    }
  }

  return totalTweets;
}
async function fetchTweets(authToken, vendorDetails, date, user_details) {
  let currentDate = moment();
  let resposnse = false;
  while (currentDate.diff(date, "M") >= 1) {
    if(is_cron_job) LoggerDebug.transport("cronfile").info(
      `Tweet Date ${date}`
    ); 
    let tweets = await fetchUserTweets(authToken, user_details, date);
    if (tweets.length > 0) {
      if(is_cron_job) LoggerDebug.transport("cronfile").info(
        `Twitter Tweet Data: ${tweets.length}`
      );
      let final_data = {
        vendor_id: vendorDetails.id,
        tweet_count: tweets.length,
        //   mentions: mentions.length,
        retweet_count: _.sumBy(tweets, "public_metrics.retweet_count"),
        reply_count: _.sumBy(tweets, "public_metrics.reply_count"),
        like_count: _.sumBy(tweets, "public_metrics.like_count"),
        quote_count: _.sumBy(tweets, "public_metrics.quote_count"),
        year: date.year(),
        month_id: date.month(),
        month: date.format("MMM").toUpperCase(),
        number_followers: user_details.public_metrics.followers_count,
        is_api_extracted: true,
      };
      await VendorTwitterDatas.findOrCreate(
        {
          year: final_data.year,
          month: final_data.month,
          vendor_id: vendorDetails.id
        },
        final_data
      );
    } else {
      //console.log("no tweets");
      if(is_cron_job) LoggerDebug.transport("cronfile").info(
        `No new tweets`
      ); 
    }
    date.add(1, "M");

  }

  return resposnse;
}

// Update Twitter data
async function updateTwitterData(vendor_id, auth) {

  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  var curyear = moment().format('YYYY');
  var lastyear = moment().subtract(1, "year").format('YYYY');

  var lastmonth = moment().subtract(1, "month").format('MMM');

  const vendortweeterquery = VendorTwitterDatas.query();

  vendortweeterquery.where("vendor_id",vendor_id);

  //Query to check last month data is present, if yes then don't fetch data
  if (lastmonth == "DEC") {
    vendortweeterquery.whereRaw('year = (?) and month = (?)', [lastyear, lastmonth]);
  } else {
    vendortweeterquery.whereRaw('year = (?) and month = (?)', [curyear, lastmonth]);

  }

  const vendortweetdata = await vendortweeterquery.pluck('id');
  
  if (!vendorDetails.twitter_handle)
    throw new Error("Handler Name not specified");

  //Removing @ if string start with @
  let twitter_handle = vendorDetails.twitter_handle.startsWith("@")
    ? vendorDetails.twitter_handle.slice(1)
    : vendorDetails.twitter_handle;

  let authToken = await Config.findOrCreate(
    { key: KEYS.TWTTER_AUTH_TOKEN },
    { key: KEYS.TWTTER_AUTH_TOKEN, value: "demo" }
  );
  // Fetch user details
  let user_details = await fetchTwitterUserDetails(
    authToken,
    twitter_handle
  );


  let lastDate = moment().subtract(1, 'y');
  //const query = await VendorTwitterDatas.query();
  const result = await VendorTwitterDatas.query()
    .where({ vendor_id: vendorDetails.id })
    .orderBy("year", "desc")
    .orderBy("month_id", "desc")
    .limit(1)
    .fetch();
  //logging
  logger.logApi(API_TYPE.TWITTER_API, vendor_id, auth.user.id);
  if (result.rows[0]) {
    lastDate = moment(
      `${result.rows[0].year}-${moment()
        .month(result.rows[0].month)
        .format("M")}-01`,
      "YYYY-M-D"
    ).add(1, "M");
  }

  var res = false;
  
  if (vendortweetdata && vendortweetdata.length > 0) {
    //Tweet data exists, no need to fetch
    if(is_cron_job) LoggerDebug.transport("cronfile").info(
      `Twitter Data exist, no need to fetch`
    );
  } else {

    res = await fetchTweets(authToken, vendorDetails, lastDate, user_details);

  }
  await fetchUserMentions(authToken, vendorDetails, user_details);
  return res;
}

async function updateAllTwitterData() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();
  query.whereNot("twitter_handle", "");
  query.whereNot("twitter_handle", null);

  const data = (await query.fetch()).toJSON();

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    if(is_cron_job) LoggerDebug.transport("cronfile").info(
      `Twitter Data: ${element.name}`
    );
    try {
      await updateTwitterData(element.id, {
        user: {
          id: null,
        },
      });
    } catch (ex) {
      error_message.push({
        vendor_id: element.id,
        message: ex.message,
      });
      if(is_cron_job) LoggerDebug.transport("cronfile").info(
        `Twitter Error: ${JSON.stringify(error_message)}`
      );
    } finally {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res(true);
        }, 1000);
      });
    }
  }
  return error_message;
}
module.exports = {
  updateAllTwitterData,
  updateTwitterData,
};
