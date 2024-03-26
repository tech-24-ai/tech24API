"use strict";

const UserLogs = use("App/Models/UserLogs.js");
const moment = require("moment");
const Query = use("Query");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with userlogs
 */

const searchInFields = [
  "name",
  "user_logs.country",
  "user_logs.city",
  "user_logs.register_from",
];
class UserLogController {
  /**
   * Show a list of all userlogs.
   * GET userlogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = UserLogs.query();
    query.leftJoin("visitors", "visitors.id", "user_logs.user_id");
    let page = 1;
    let pageSize = 100;

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
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    query.select("user_logs.*", "visitors.name");

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "register_from":
            query.whereRaw(`user_logs.register_from LIKE '%${filter.value}%'`);
            break;
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `user_logs.created_at`,
                date: filter.value,
              })
            );
            // query.whereRaw(
            //   typeof filter.value == "object"
            //     ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
            //     : `DATE(${filter.name}) = '${moment(filter.value).format(
            //         "YYYY-MM-DD"
            //       )}'`
            // );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `user_logs.updated_at`,
                date: filter.value,
              })
            );
            // query.whereRaw(
            //   typeof filter.value == "object"
            //     ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
            //     : `DATE(${filter.name}) = '${moment(filter.value).format(
            //         "YYYY-MM-DD"
            //       )}'`
            // );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    const result = await query.paginate(page, pageSize);

    return response.status(200).send(result);
  }

  /**
   * Render a form to be used for creating a new userlog.
   * GET userlogs/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new userlog.
   * POST userlogs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {}

  /**
   * Display a single userlog.
   * GET userlogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {}

  /**
   * Render a form to update an existing userlog.
   * GET userlogs/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update userlog details.
   * PUT or PATCH userlogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a userlog with id.
   * DELETE userlogs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = UserLogController;
