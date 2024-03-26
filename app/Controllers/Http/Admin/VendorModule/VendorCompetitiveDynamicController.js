"use strict";
const VendorCompetitiveDynamics = use(
  "App/Models/Admin/VendorModule/VendorCompetitiveDynamics"
);
const Category = use("App/Models/Front/ProductModule/Category");

const Query = use("Query");
const moment = require("moment");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const searchInFields = [
  "id",
  "bubble_name",
  "bubble_size",
  "bubble_x",
  "vendor_id",
  "bubble_color",
  "bubble_y",
  "year",
  "market",
  "revenue",
];
const requestOnly = [
  "bubble_name",
  "bubble_size",
  "bubble_x",
  "vendor_id",
  "bubble_color",
  "bubble_y",
  "year",
  "quarter",
  "market",
  "revenue",
];
/**
 * Resourceful controller for interacting with vendorcompetitivedynamics
 */
class VendorCompetitiveDynamicController {
  /**
   * Show a list of all vendorcompetitivedynamics.
   * GET vendorcompetitivedynamics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorCompetitiveDynamics.query();
    query.select("vendor_competitive_dynamics.*");
    query.select("modules.name as market_name");
    query.leftJoin("modules", "modules.id", "vendor_competitive_dynamics.market");
    query.leftJoin("vendors", "vendors.id", "vendor_competitive_dynamics.vendor_id");
    query.where("vendor_id", params.vendor_id);
    query.select("vendors.vendor_category_id")
    
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
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
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
   * Render a form to be used for creating a new vendorcompetitivedynamic.
   * GET vendorcompetitivedynamics/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendorcompetitivedynamic.
   * POST vendorcompetitivedynamics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorCompetitiveDynamics.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendorcompetitivedynamic.
   * GET vendorcompetitivedynamics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorCompetitiveDynamics.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing vendorcompetitivedynamic.
   * GET vendorcompetitivedynamics/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update vendorcompetitivedynamic details.
   * PUT or PATCH vendorcompetitivedynamics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorCompetitiveDynamics.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a vendorcompetitivedynamic with id.
   * DELETE vendorcompetitivedynamics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorCompetitiveDynamics.findOrFail(params.id);
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
    const result = await VendorCompetitiveDynamics.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  async categories({ response }) {
    const query = Category.query();
    query.with("children.children.children.children.children");
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = VendorCompetitiveDynamicController;
