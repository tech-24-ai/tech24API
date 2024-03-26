"use strict";
const VendorAcquisitionLists = use(
  "App/Models/Admin/VendorModule/VendorAcquisitionLists"
);
const Query = use("Query");
const moment = require("moment");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const searchInFields = [
  "vendor_acquisition_lists.id",
  "vendor_acquisition_lists.acquired_company_name",
  "vendor_acquisition_lists.date_of_acquisition",
  "vendor_acquisition_lists.vendor_id",
  "currencies.name",
  "vendor_acquisition_lists.website",
  "vendor_acquisition_lists.acquired_amount",
];
const requestOnly = [
  "logo_acquried_company",
  "acquired_company_name",
  "date_of_acquisition",
  "vendor_id",
  "website",
  "currency",
  "acquired_amount",
];
/**
 * Resourceful controller for interacting with vendoracquisitions
 */
class VendorAcquisitionController {
  /**
   * Show a list of all vendoracquisitions.
   * GET vendoracquisitions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorAcquisitionLists.query();
    query.select("vendor_acquisition_lists.*");
    query.select("currencies.name as currency_name");
    query.leftJoin("currencies", "currencies.id", "vendor_acquisition_lists.currency");
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
            if (filter.name == "currency_name") {
              query.whereRaw(`currencies.name LIKE '%${filter.value}%'`);
            } else {
              query.whereRaw(
                `vendor_acquisition_lists.${filter.name} LIKE '%${filter.value}%'`
              );
            }
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
   * Render a form to be used for creating a new vendoracquisition.
   * GET vendoracquisitions/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendoracquisition.
   * POST vendoracquisitions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorAcquisitionLists.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendoracquisition.
   * GET vendoracquisitions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorAcquisitionLists.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }
  /**
   * Update vendoracquisition details.
   * PUT or PATCH vendoracquisitions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorAcquisitionLists.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorAcquisitionLists.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  /**
   * Delete a vendoracquisition with id.
   * DELETE vendoracquisitions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorAcquisitionLists.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
}

module.exports = VendorAcquisitionController;
