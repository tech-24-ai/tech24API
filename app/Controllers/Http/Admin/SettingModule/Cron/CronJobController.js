"use strict";
const CronJob = use("App/Models/Admin/SettingModule/Cron/CronJob");
const Query = use("Query");
const moment = require("moment");

const searchInFields = ["id", "name", "frequency", "type"];

const requestOnly = ["name", "frequency", "type", "start_date"];
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with cronjobs
 */
class CronJobController {
  /**
   * Show a list of all cronjobs.
   * GET cronjobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = CronJob.query();
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
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
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
   * Render a form to be used for creating a new cronjob.
   * GET cronjobs/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new cronjob.
   * POST cronjobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    body.status = "RUNNING";
    body.last_execution_date = moment().subtract(1,'d').toISOString();
    body = {
      ...body,
      next_execution_date:body.start_date,
      ...this.getPeriod(body.frequency)
    }    
    const query = await CronJob.create(body);
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  getPeriod(frequency){
    let result = {
      period:"0"
    }
    switch (frequency) {
      case "ONCE":
        result.period = "0";
        break;
      case "DAILY":
        result.period = "1d";
        break;
      case "WEEKLY":
        result.period = "1w";
        break;
      case "MONTHLY":
        result.period = "1M";
        break;
      case "QUATERLY":
        result.period = "1Q";
        break;
      case "HALF_YEARLY":
        result.period = "2Q";
        break;
      case "YEARLY":
        result.period = "1Y";
        break;
      default:
        break;
    }
    return result;
  }
  /**
   * Display a single cronjob.
   * GET cronjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = CronJob.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing cronjob.
   * GET cronjobs/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update cronjob details.
   * PUT or PATCH cronjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await CronJob.findOrFail(params.id);
    body.last_execution_date = moment().subtract(1,'d').toISOString();
    body.status = "RUNNING";
    if(body.frequency == "DAILY") body.start_date = moment().toISOString()
    body = {
      ...body,
      next_execution_date:body.start_date,
      ...this.getPeriod(body.frequency)
    }
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a cronjob with id.
   * DELETE cronjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await CronJob.findOrFail(params.id);
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

module.exports = CronJobController;
