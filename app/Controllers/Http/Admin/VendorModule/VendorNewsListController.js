"use strict";
const VendorNewsLists = use("App/Models/Admin/VendorModule/VendorNewsLists");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Query = use("Query");
const moment = require("moment");
const rssService = require("../../../../services/rss.service");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const requestOnly = [
  "news_title",
  "news_link",
  "news_thumbnail",
  "is_news_active",
  "news_date",
  "news_source",
  "vendor_id",
];

const searchInFields = [
  "vendor_news_lists.id",
  "vendor_news_lists.news_title",
  "vendor_news_lists.news_link",
  "vendor_news_lists.news_thumbnail",
  "vendor_news_lists.is_news_active",
  "vendor_news_lists.news_date",
  "vendor_news_lists.news_source",
  "vendor_news_lists.vendor_id",
  "rsses.name",
];
/**
 * Resourceful controller for interacting with vendornewslists
 */
class VendorNewsListController {
  /**
   * Show a list of all vendornewslists.
   * GET vendornewslists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorNewsLists.query();
    query.select("vendor_news_lists.*");
    query.select("rsses.name as rss_name");
    query.leftJoin("rsses", "rsses.id", "vendor_news_lists.news_source");
    query.where("vendor_id", params.vendor_id);
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
                queryStr += `vendor_news_lists.${filter.name} LIKE '%${x}%'`;
              });
            } else {
              if (filter.name == "rss_name") {
                queryStr += `rsses.name LIKE '%${filter.value}%'`;
              } else {
                queryStr += `vendor_news_lists.${filter.name} LIKE '%${filter.value}%'`;
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
   * Render a form to be used for creating a new vendornewslist.
   * GET vendornewslists/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendornewslist.
   * POST vendornewslists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorNewsLists.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendornewslist.
   * GET vendornewslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorNewsLists.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing vendornewslist.
   * GET vendornewslists/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update vendornewslist details.
   * PUT or PATCH vendornewslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorNewsLists.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a vendornewslist with id.
   * DELETE vendornewslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorNewsLists.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  /**
   * Update vendorgoogletrend details using googletrend package.
   * GET vendorgoogletrends/:id/fetcb
   *
   * @param {object} ctx.params
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async fetch({ params, auth, request, response }) {
    try {
      const vendorDetails = await Vendor.findByOrFail("id", params.vendor_id);
      let list = await rssService(params.vendor_id, auth);
      let message = "No new news to updated";
      
      if (list.length>0) {
        if (list.includes(vendorDetails.name)) {
          message = `News updated for ${JSON.stringify(list)}`;
        } else {
          if((list[list.length-1]).indexOf("message") >= 0)
            message = `No News for ${vendorDetails.name}. Error - ${JSON.stringify(list)}`;
          else
            message = `No News for ${vendorDetails.name}. News updated for ${JSON.stringify(list)}`;
        }
      }
      return response.status(200).send({
        message,
      });
    } catch (ex) {
      return response.status(422).send([{ message: ex.message }]);
    }
  }
  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorNewsLists.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }
}

module.exports = VendorNewsListController;
