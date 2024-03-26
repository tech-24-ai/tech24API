"use strict";

const CompetitiveLandscape = use(
  "App/Models/Admin/CompetitiveLandscape/CompetitiveLandscape"
);
const ModuleSubcription = use("App/Models/ModuleSubscription");
const Drive = use('Drive')
const MarketPlan = use("App/Models/MarketPlan");
const Subcription = use("App/Models/Subcription");
const Module = use("App/Models/Admin/ProductModule/Module");
const Category = use("App/Models/Front/ProductModule/Category");
const Document = use("App/Models/Admin/DocumentModule/Document");
const _ = require("lodash");
const { verifySegmentSubscription } = require("../../Helper/userSubscription");

const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "bubble_name",
  "bubble_size",
  "bubble_x",
  "bubble_y",
  "bubble_color",
  "year",
  "quarter",
  "market",
];

class CompetitiveLandscapeController {
  async index({ request, response }) {
    const query = CompetitiveLandscape.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("year")) {
      query.where("year", request.input("year"));
    }

    if (request.input("market")) {
      query.where("market", request.input("market"));
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

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    var result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  async store({ request, response }) {
    const query = new CompetitiveLandscape();

    query.vendor_id = request.input("vendor_id");
    query.bubble_name = request.input("bubble_name");
    query.bubble_size = request.input("bubble_size");
    query.bubble_x = request.input("bubble_x");
    query.bubble_y = request.input("bubble_y");
    query.bubble_color = request.input("bubble_color");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.market = request.input("market");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async market({ params, response, request, auth }) {
    let is_subscribed = false;
    try {
      const user = await auth.authenticator("investorAuth").getUser();
      is_subscribed = await verifySegmentSubscription(user.id, 6);
    } catch (ex) {}

    const query = CompetitiveLandscape.query();
    query.select("modules.name as market_name");
    query.select("competitive_landscapes.year");
    query.leftJoin("modules", "modules.id", "competitive_landscapes.market");
    let market;
    query.distinct("competitive_landscapes.market");
    market = await query.fetch();
    return response.status(200).send({ result: market, is_subscribed });
  }

  async show({ params, response }) {
    const query = CompetitiveLandscape.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await CompetitiveLandscape.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.bubble_name = request.input("bubble_name");
    query.bubble_size = request.input("bubble_size");
    query.bubble_x = request.input("bubble_x");
    query.bubble_y = request.input("bubble_y");
    query.bubble_color = request.input("bubble_color");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.market = request.input("market");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await CompetitiveLandscape.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async getMarketforSubscription({ params, response, request }) {
    const query = Category.query();
    const not_categories = request.input("not_categories");
    if (not_categories) query.whereNotIn("id", JSON.parse(not_categories));
    query.with("children.children.children.children.children");
    const result = await query.fetch();

    const clquery = CompetitiveLandscape.query();

    clquery.leftJoin("modules", "modules.id", "competitive_landscapes.market");

    clquery.distinct("competitive_landscapes.market");
    const marketids = await clquery.pluck("market");

    return response
      .status(200)
      .send(this.filterCategory(result.toJSON(), marketids));
  }

  filterCategory(data, ids) {
    let result = _.filter(data, (item) => {
      if (item.children && item.children.length) {
        item.children = this.filterCategory(item.children, ids);
        return item.children.length ? true : false;
      } else {
        return ids.includes(item.id) ? true : false;
      }
    });
    return result;
  }

  async getDocumentsforSubscribedMarket({ params, response, request, auth }) {
    const user_id = auth.user.id;
    const market_id = request.input("market_id");

    const plans = await MarketPlan.query().where('segment_id', 6).pluck('id');
    //Check if Investor has subscribed for any plan
    const query = Subcription.query();

    query.whereRaw(`user_id = (?) AND plan_id in (?)`, [
        user_id,
        plans
    ]);

    let result = await query.fetch();

    if (result.toJSON().length > 0) {
      //Check if Investor has subscribed for any plan
      const docquery = Document.query();

      docquery.leftJoin(
        "module_documents",
        "module_documents.document_id",
        "documents.id"
      );

      docquery.where("module_id", market_id);
      docquery.select("document_types.name as document_type");

      docquery.leftJoin(
        "document_types",
        "document_types.id",
        "documents.document_type_id"
      );

      docquery.select(
        "documents.id",
        "documents.name",
        "documents.extension",
        "documents.description",
        "documents.created_at",
        "documents.updated_at"
      );
      let docresult = await docquery.fetch();

      return response.status(200).send(docresult);
    } else {
      return response.status(200).send({ message: "No Documents available" });
    }
  }
}

module.exports = CompetitiveLandscapeController;
