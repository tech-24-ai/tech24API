'use strict'

const moment = require("moment");
const Query = use("Query");
const NubelaLog = use("App/Models/Admin/LoggerModule/NubelaLog");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with nubelalogs
 */
class NubelaLogController {
  /**
   * Show a list of all nubelalogs.
   * GET nubelalogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
   async index({ request, response, view }) {
    const query = NubelaLog.query();
    query.leftJoin("vendors", "vendors.id", "nubela_logs.vendor_id");
    let page = 1;
    let pageSize = 100;
    // console.log('query',query)

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`nubela_logs.${orderBy}`, orderDirection);
    }
    query.orderBy(`nubela_logs.created_at`, "desc");
    if (search) {
      query.where(searchQuery.search(searchInFields));
    }
    query.select(`nubela_logs.created_at`)
    query.select(`nubela_logs.type`,'nubela_logs.json_data as logs')

    query.select(`vendors.name`)

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

    
    const result = await query.paginate(page, pageSize);
    // console.log("Data",result)

    return response.status(200).send(result);
  }

  /**
   * Render a form to be used for creating a new nubelalog.
   * GET nubelalogs/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new nubelalog.
   * POST nubelalogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single nubelalog.
   * GET nubelalogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Render a form to update an existing nubelalog.
   * GET nubelalogs/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update nubelalog details.
   * PUT or PATCH nubelalogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a nubelalog with id.
   * DELETE nubelalogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = NubelaLogController
