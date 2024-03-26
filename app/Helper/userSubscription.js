const Subcription = use("App/Models/Subcription");
const moment = require("moment");
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");
const _ = require("lodash");
const Country = use("App/Models/Admin/LocationModule/Country");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");

async function getUserSubscribtions(userId, mi_segment_id = -1) {
  let response = {
    allowedModules: [],
    allowedCountries: [],
    allowedRegions: [],
  };

  try {
    const subcriptionQuery = Subcription.query();
    subcriptionQuery.leftJoin(
      "market_plans",
      "market_plans.id",
      "subcriptions.plan_id"
    );
    subcriptionQuery.where("subcriptions.user_id", "" + userId);
    subcriptionQuery.select("market_plans.id as plan_id");
    subcriptionQuery.select("subcriptions.id");
    subcriptionQuery.where("market_plans.segment_id", mi_segment_id);
    let currentDate = moment().format("YYYY-MM-DD");
    subcriptionQuery.whereRaw(
      `DATE(subcriptions.subscription_end_date) >= '${currentDate}'`
    );
    subcriptionQuery.with("modules");
    subcriptionQuery.with("countries");
    subcriptionQuery.with("regions");

    let rawResult = await subcriptionQuery.fetch();
    let parsedSubcriptionResult = rawResult.toJSON();

    parsedSubcriptionResult.forEach((subscription) => {
      response.allowedModules = [
        ...response.allowedModules,
        ...subscription.modules.map((x) => x.id),
      ];
      response.allowedCountries = [
        ...response.allowedCountries,
        ...subscription.countries.map((x) => x.id),
      ];
      response.allowedRegions = [
        ...response.allowedRegions,
        ...subscription.regions.map((x) => x.id),
      ];
    });
    if (response.allowedRegions.length && !response.allowedCountries.length) {
      let countryQuery = Country.query();
      countryQuery.whereIn("group_id", response.allowedRegions);
      let result = (await countryQuery.fetch()).toJSON();
      response.allowedCountries = result.map((x) => x.id);
    }



    if (response.allowedCountries.length && !response.allowedRegions.length) {
      let countryGroupQuery = CountryGroup.query();
      countryGroupQuery.leftJoin(
        "countries",
        "countries.group_id",
        "country_groups.id"
      );
      countryGroupQuery.whereIn("countries.id", response.allowedCountries);
      let result = (await countryGroupQuery.fetch()).toJSON();
      
    
      response.allowedRegions = result.map((x) => x.group_id);
      
    }
  } catch (ex) {
    console.log(ex);
  }
  return response;
}
async function getAllSubscription(user_id) {
  let segments = (await MISegment.query().fetch()).toJSON();
  const query = Subcription.query();
  query.where("subscription_end_date", ">", new Date());
  query.where("subcriptions.user_id", user_id);
  query.with("plans");
  query.with("modules");
  query.with("countries");
  query.with("regions");
  let data = (await query.fetch()).toJSON();
  data = _.groupBy(data, "plans.segment_id");
  return segments.map((x) => {
    return {
      ...x,
      data: data[x.id] ? data[x.id] : [],
    };
  });
}
async function verifySegmentSubscription(user_id, mi_segmentid = -1) {
  try {
    const subcriptionQuery = Subcription.query();
    subcriptionQuery.leftJoin(
      "market_plans",
      "market_plans.id",
      "subcriptions.plan_id"
    );
    subcriptionQuery.where("subcriptions.user_id", "" + user_id);
    subcriptionQuery.select("market_plans.id as plan_id");
    subcriptionQuery.select("subcriptions.id");
    subcriptionQuery.where("market_plans.segment_id", mi_segmentid);
    let currentDate = moment().format("YYYY-MM-DD");
    subcriptionQuery.whereRaw(
      `DATE(subcriptions.subscription_end_date) >= '${currentDate}'`
    );
    let rawResult = (await subcriptionQuery.fetch()).toJSON();
    return rawResult.length ? true : false;
  } catch (ex) {}
  return false;
}
module.exports = {
  getUserSubscribtions,
  getAllSubscription,
  verifySegmentSubscription,
};
