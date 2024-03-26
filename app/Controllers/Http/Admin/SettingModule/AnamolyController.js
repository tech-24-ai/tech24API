'use strict'

const Anomaly = use("App/Models/Admin/SettingModule/Anamoly");
const User = use("App/Models/Admin/UserModule/User");
const moment = require("moment");
const Excel = require("exceljs");
const Query = use("Query");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with anomalies
 */



const searchInFields = ["id", "table_name", "errors"];

class AnamolyController {
  /**
   * Show a list of all anomalies.
   * GET anomalies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {

    const query = Anomaly.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("vendors");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var usernamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {

          case "users.name":
            usernamefilter = users.name;
            break;
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

    if (usernamefilter.length > 0) {
      const userids = await User.query().whereRaw(`name LIKE '%${usernamefilter}%'`).pluck('id');
      if (userids.length > 0) query.whereRaw('resolved_id in (?)', [userids]);
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
   * Render a form to be used for creating a new Config.
   * GET anomalies/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {

  }

  /**
   * Create/save a new Config.
   * POST anomalies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {


  }

  /**
   * Display a single Config.
   * GET anomalies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {

    const resultQuery = Anomaly.query();
    resultQuery.where("id", params.id);
    resultQuery.with("users");
    resultQuery.with("vendors");

    const result = await resultQuery.fetch();

    return response.status(200).send(result);

  }

  /**
   * Render a form to update an existing Config.
   * GET anomalies/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {
  }

  /**
   * Update Config details.
   * PUT or PATCH anomalies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {

    const query = await Anomaly.findOrFail(params.id)

    query.current_status = request.input('status')
    query.resolved_id = auth.user.id
    query.descriptions = request.input('descriptions')
    await query.save()

    return response.status(200).send({ message: 'Updated successfully' })

  }

  /**
   * Delete a Config with id.
   * DELETE anomalies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {

  }

  /**
   * .
   * GET Count of Open Anomalies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getOpenCount({ request, response, view }) {

    const query = Anomaly.query();

    //Open anomalies
    query.where("current_status", 0);

    var result = await query.count('* as total');

    return response.status(200).send(result);

  }

  async getCronlogdata({ request, response, view }) {

    var fs = require('fs');
    
    var res = "test";
    
    try {
      var data = fs.readFileSync('../../../../tmp/cron.log', 'utf8');
    
      res = data.toString();
      console.log('Data:', res);
    } catch (e) {
      res = "No Logs available"
      console.log('Error:', e.stack);
    }

    return response.status(200).send(res);
  }


}

module.exports = AnamolyController
