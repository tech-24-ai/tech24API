"use strict";
const VendorFinancials = use("App/Models/Admin/VendorModule/VendorFinancials");
const Query = use("Query");
const moment = require("moment");
const financialService = require("../../../../services/financials.service");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const requestOnly = [
  "net_income",
  "total_assets",
  "total_liabilities",
  "vendor_id",
  "total_equity",
  "financial_leverage",
  "debt_equity_ratio",
  "reported_eps",
  "gross_profit",
  "rd_investment",
  "current_debt",
  "total_shares",
  "revenue",
  "p_e_ratio",
  "year",
  "revenue_range",
  "quarter",
  "source",
];

const searchInFields = [
  "id",
  "net_income",
  "total_assets",
  "total_liabilities",
  "vendor_id",
  "total_equity",
  "financial_leverage",
  "debt_equity_ratio",
  "reported_eps",
  "gross_profit",
  "rd_investment",
  "current_debt",
  "total_shares",
  "revenue",
  "p_e_ratio",
  "year",
  "quarter",
  "source",
];
/**
 * Resourceful controller for interacting with vendorfinancials
 */
class VendorFinancialController {
  /**
   * Show a list of all vendorfinancials.
   * GET vendorfinancials
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorFinancials.query();
    query.orderBy("year", "desc");
    query.orderByRaw("FIELD(quarter,'ALL','Q4','Q3','Q2','Q1')");
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
   * Render a form to be used for creating a new vendorfinancial.
   * GET vendorfinancials/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendorfinancial.
   * POST vendorfinancials
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorFinancials.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendorfinancial.
   * GET vendorfinancials/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorFinancials.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Update vendorfinancial details.
   * PUT or PATCH vendorfinancials/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorFinancials.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorFinancials.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  /**
   * Delete a vendorfinancial with id.
   * DELETE vendorfinancials/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorFinancials.findOrFail(params.id);
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
   * Update finanical details.
   * GET vendorfinancials/:id/fetch
   *
   * @param {object} ctx.params
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async fetch({ params, auth, request, response }) {
    try {
      await financialService.updateVendorFinancials(params.vendor_id, auth);
      return response.status(200).send({
        message: `Financial data updated`,
      });
    } catch (ex) {
      return response
        .status(422)
        .send({ message: ex.message });
    }
  }
}

module.exports = VendorFinancialController;
