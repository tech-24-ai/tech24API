'use strict'

const moment = require("moment");
const Query = use("Query");
const SignalHireLog = use("App/Models/Admin/LoggerModule/SignalHireLog");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with signalhirelogs
 */
class SignalHireLogController {
  /**
   * Show a list of all signalhirelogs.
   * GET signalhirelogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
   async index({ request, response, view }) {
    const query = SignalHireLog.query();
    query.leftJoin("visitors", "visitors.id", "signalhire_logs.visitor_id");
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
      query.orderBy(`signalhire_logs.${orderBy}`, orderDirection);
    }
    query.orderBy(`signalhire_logs.created_at`, "desc");
    if (search) {
      query.where(searchQuery.search(searchInFields));
    }
    query.select(`signalhire_logs.created_at`)
    query.select(`signalhire_logs.type`,'signalhire_logs.json_data as logs')

    query.select(`visitors.name`)

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
   * Render a form to be used for creating a new signalhirelog.
   * GET signalhirelogs/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new signalhirelog.
   * POST signalhirelogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single signalhirelog.
   * GET signalhirelogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Render a form to update an existing signalhirelog.
   * GET signalhirelogs/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update signalhirelog details.
   * PUT or PATCH signalhirelogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a signalhirelog with id.
   * DELETE signalhirelogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = SignalHireLogController
