"use strict";
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const MarketPlan = use("App/Models/MarketPlan");
const Subcription = use("App/Models/Subcription");
const moment = require("moment");
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");
const { MI_CONFIG } = require("../../../../Helper/constants");
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");

class CountryGroupController {
  async index({ request, response, view }) {
    const query = CountryGroup.query();
    if (request.input("countries") && request.input("countries") == "1") {
      query.with("countries");
    }
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async subscriptionCountryGroups({ request, response, view }) {
    const plan_id = request.input("plan_id");
    const query = CountryGroup.query();
    if (request.input("countries") && request.input("countries") == "1") {
      query.with("countries");
    }

    const planResult = await MarketPlan.findOrFail(plan_id);
    const regionsIds = await planResult.regions().ids();
    query.whereIn("country_groups.id", regionsIds);

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async countryGroupsSubscribed({ auth, request, response, view }) {
    let segment_id = request.input("segment_id");
    const mi_segment = await MISegment.findOrFail(segment_id);
    let regions = [];
    if (!mi_segment.is_free && MI_CONFIG[segment_id].module_region) {
      const user = await auth.authenticator("investorAuth").getUser();
      const { allowedRegions } = await getUserSubscribtions(
        user.id,
        segment_id
      );
      regions = allowedRegions;
    }

    const query = CountryGroup.query();
    if (request.input("countries") && request.input("countries") == "1") {
      query.with("countries");
    }
    if (MI_CONFIG[segment_id].module_region) {
      query.whereIn("country_groups.id", regions);
    }
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = CountryGroupController;
