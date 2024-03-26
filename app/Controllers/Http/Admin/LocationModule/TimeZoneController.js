"use strict";
const TimeZone = use("App/Models/Admin/LocationModule/TimeZone");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const searchInFields = ["sort_name", "name", "zone"];

class TimeZoneController {
  async index({ request, response, view }) {
    const query = TimeZone.query();
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

  async store({ request, response }) {
    const query = new TimeZone();
    query.name = request.input("name");
    query.sort_name = request.input("sort_name");
    query.zone = request.input("zone");
    query.offset = request.input("offset");
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = TimeZone.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await TimeZone.findOrFail(params.id);
    query.name = request.input("name");
    query.sort_name = request.input("sort_name");
    query.zone = request.input("zone");
    query.offset = request.input("offset");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await TimeZone.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }
}

module.exports = TimeZoneController;
