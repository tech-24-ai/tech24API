'use strict'

const PricingModel = use("App/Models/PricingModel");
const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "id",
  "name",
  "description"
];

const requestOnly = [
  "name",
  "description"
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with pricingmodels
 */
class PricingModelController {
  /**
   * Show a list of all pricingmodels.
   * GET pricingmodels
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = PricingModel.query();
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

  /**
   * Render a form to be used for creating a new pricingmodel.
   * GET pricingmodels/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new pricingmodel.
   * POST pricingmodels
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    var body = request.only(requestOnly);
    await PricingModel.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single pricingmodel.
   * GET pricingmodels/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    const query = PricingModel.query()
    query.where('id', params.id)
    const result = await query.firstOrFail()
    return response.status(200).send(result)
  }

  /**
   * Render a form to update an existing pricingmodel.
   * GET pricingmodels/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update pricingmodel details.
   * PUT or PATCH pricingmodels/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const query = await PricingModel.findOrFail(params.id)
    query.name = request.input('name')
    query.description = request.input('description')
    await query.save()
    return response.status(200).send({ message: 'Update successfully' })
  }

  /**
   * Delete a pricingmodel with id.
   * DELETE pricingmodels/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const query = await PricingModel.findOrFail(params.id)
    try {
        await query.delete()
        return response.status(200).send({ message: 'Delete successfully' })
    } catch (error) {
        return response.status(423).send({ message: 'Something went wrong' })
    }
  }
}

module.exports = PricingModelController
