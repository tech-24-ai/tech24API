"use strict";
const VendorTwitterDatas = use(
  "App/Models/Admin/VendorModule/VendorTwitterDatas"
);
const Query = use("Query");
const moment = require("moment");
const twitterService = require("../../../../services/twitter.service");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const requestOnly = [
  "tweet_count",
  "retweet_count",
  "vendor_id",
  "number_followers",
  "mentions",
  "year",
  "month",
  "sentiment",
  "quote_count",
  "like_count",
  "reply_count",
];

const searchInFields = [
  "vendor_twitter_datas.id",
  "vendor_twitter_datas.tweet_count",
  "vendor_twitter_datas.retweet_count",
  "vendor_twitter_datas.vendor_id",
  "vendor_twitter_datas.number_followers",
  "vendor_twitter_mentions.mention_count",
  "vendor_twitter_datas.year",
  "vendor_twitter_datas.month",
  "vendor_twitter_datas.sentiment",
];
/**
 * Resourceful controller for interacting with vendortwitterdata
 */
class VendorTwitterDataController {
  /**
   * Show a list of all vendortwitterdata.
   * GET vendortwitterdata
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorTwitterDatas.query();
    query.select("vendor_twitter_datas.*");
    query.select("vendor_twitter_mentions.mention_count as mention_count");
    query.orderBy("year","desc")
    query.orderBy("month_id","desc")
    query.leftJoin("vendor_twitter_mentions", function () {
      this.on(
        "vendor_twitter_mentions.vendor_id",
        "vendor_twitter_datas.vendor_id"
      )
        .on("vendor_twitter_mentions.year", "vendor_twitter_datas.year")
        .on("vendor_twitter_mentions.month", "vendor_twitter_datas.month");
    });
    query.where("vendor_twitter_datas.vendor_id", params.vendor_id);
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
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `vendor_twitter_datas.${filter.name} LIKE '%${x}%'`;
              });
            } else {
              if (filter.name == "mention_count") {
                queryStr = `vendor_twitter_mentions.${filter.name} LIKE '%${filter.value}%'`;
              } else {
                queryStr = `vendor_twitter_datas.${filter.name} LIKE '%${filter.value}%'`;
              }
            }
            query.whereRaw(queryStr);
            break;
        }
      });
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

  /**
   * Render a form to be used for creating a new vendortwitterdata.
   * GET vendortwitterdata/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendortwitterdata.
   * POST vendortwitterdata
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorTwitterDatas.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendortwitterdata.
   * GET vendortwitterdata/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorTwitterDatas.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing vendortwitterdata.
   * GET vendortwitterdata/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update vendortwitterdata details.
   * PUT or PATCH vendortwitterdata/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorTwitterDatas.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a vendortwitterdata with id.
   * DELETE vendortwitterdata/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorTwitterDatas.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorTwitterDatas.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  /**
   * Update Web Traffic details.
   * GET vendorwebtraffics/:id/fetch
   *
   * @param {object} ctx.params
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async fetch({ params, auth, request, response }) {
    try {
      await twitterService.updateTwitterData(params.vendor_id, auth);
      return response.status(200).send({
        message: `Twitter data updated`,
      });
    } catch (ex) {
      return response.status(422).send({ message: ex.message });
    }
  }
}

module.exports = VendorTwitterDataController;
