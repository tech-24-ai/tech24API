"use strict";
const MarketPlan = use("App/Models/MarketPlan");
const Country = use("App/Models/Admin/LocationModule/Country");
const Query = use("Query");
const Subcription = use("App/Models/Subcription");
const moment = require("moment");
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");
const { MI_CONFIG } = require("../../../../Helper/constants");
const searchInFields = ["countries.sortname", "countries.name"];
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");

class CountryController {
  async index({ request, response, view }) {
    const query = Country.query();
    query.select("countries.*");
    query.select("country_groups.name as group");

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("perPage")) {
      perPage = request.input("perPage");
    }
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const searchQuery = new Query(request, { order: "id" });
    if (orderBy && orderPos) {
      query.orderBy(orderBy, orderPos);
    }
    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    query.leftJoin("country_groups", "country_groups.id", "countries.group_id");

    query.where("active", true);
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async subscriptionCountries({ request, response, view }) {
    const plan_id = request.input("plan_id");
    const query = Country.query();
    query.select("countries.*");
    query.select("country_groups.name as group");

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("perPage")) {
      perPage = request.input("perPage");
    }
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const searchQuery = new Query(request, { order: "id" });
    if (orderBy && orderPos) {
      query.orderBy(orderBy, orderPos);
    }
    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    query.leftJoin("country_groups", "country_groups.id", "countries.group_id");

    query.where("active", true);

    const planResult = await MarketPlan.findOrFail(plan_id);
    const countriesIds = await planResult.countries().ids();
    query.whereIn("countries.id", countriesIds);

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async countriesSubscribed({ auth, request, response, view }) {
    let segment_id = request.input("segment_id");
    const mi_segment = await MISegment.findOrFail(segment_id);
    let countries = [];
    if (!mi_segment.is_free && MI_CONFIG[segment_id].module_country) {
      const user = await auth.authenticator("investorAuth").getUser();
      const { allowedCountries } = await getUserSubscribtions(
        user.id,
        segment_id
      );
      countries = allowedCountries;
    }

    const query = Country.query();
    query.select("countries.*");
    query.select("country_groups.name as group");

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("perPage")) {
      perPage = request.input("perPage");
    }
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const searchQuery = new Query(request, { order: "id" });
    if (orderBy && orderPos) {
      query.orderBy(orderBy, orderPos);
    }
    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    query.leftJoin("country_groups", "country_groups.id", "countries.group_id");
    if (MI_CONFIG[segment_id].module_country)
      query.whereIn("countries.id", countries);
    query.where("active", true);
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async list({ request, response, view }) {
    const query = Country.query();
    query.select("id", "name as label");
    query.groupBy("name");
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = CountryController;
