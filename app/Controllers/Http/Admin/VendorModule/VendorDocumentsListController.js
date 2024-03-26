"use strict";
const VendorDocuments = use("App/Models/Admin/VendorModule/VendorDocuments");
const Query = use("Query");
const moment = require("moment");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const requestOnly = [
  "document_type",
  "document_title",
  "document_file_name",
  "vendor_id",
];
const searchInFields = [
  "document_types.name",
  "vendor_documents.document_title",
  "vendor_documents.document_file_name",
  "vendor_documents.vendor_id",
];
/**
 * Resourceful controller for interacting with vendordocumentslists
 */
class VendorDocumentsListController {
  /**
   * Show a list of all vendordocumentslists.
   * GET vendordocumentslists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorDocuments.query();
    query.select("vendor_documents.*");
    query.select("document_types.name as document_name");
    query.leftJoin(
      "document_types",
      "document_types.id",
      "vendor_documents.document_type"
    );
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
            if (filter.name == "document_name") {
              query.whereRaw(`document_types.name LIKE '%${filter.value}%'`);
            } else {
              query.whereRaw(
                `vendor_documents.${filter.name} LIKE '%${filter.value}%'`
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
   * Render a form to be used for creating a new vendordocumentslist.
   * GET vendordocumentslists/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendordocumentslist.
   * POST vendordocumentslists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorDocuments.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendordocumentslist.
   * GET vendordocumentslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorDocuments.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing vendordocumentslist.
   * GET vendordocumentslists/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update vendordocumentslist details.
   * PUT or PATCH vendordocumentslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorDocuments.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a vendordocumentslist with id.
   * DELETE vendordocumentslists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorDocuments.findOrFail(params.id);
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
    const result = await VendorDocuments.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

}

module.exports = VendorDocumentsListController;
