"use strict";

const VendorCompetitiveDynamic = use("App/Models/VendorCompetitiveDynamic");

const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "bubble_name",
  "bubble_size",
  "bubble_x",
  "bubble_y",
  "bubble_color",
  "year",
  "quarter",
  "market",
];

class VendorCompetitiveDynamicController {
  async index({ request, response }) {
    const query = VendorCompetitiveDynamic.query();
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

    if (request.input("vendor_id")) {
      query.where("vendor_id", request.input("vendor_id"));
    }

    if (request.input("year")) {
      query.where("year", request.input("year"));
    }

    if (request.input("market")) {
      query.where("market", request.input("market"));
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

  async store({ request, response }) {
    const query = new VendorCompetitiveDynamic();

    query.vendor_id = request.input("vendor_id");
    query.bubble_name = request.input("bubble_name");
    query.bubble_size = request.input("bubble_size");
    query.bubble_x = request.input("bubble_x");
    query.bubble_y = request.input("bubble_y");
    query.bubble_color = request.input("bubble_color");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.market = request.input("market");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async market({ params, response, request }) {    
    const query = VendorCompetitiveDynamic.query();
    query.select("modules.name as market_name");
    query.select("vendor_competitive_dynamics.year");
    query.leftJoin(
      "modules",
      "modules.id",
      "vendor_competitive_dynamics.market"
    );
    let market;
    let years;
    if (request.input("vendor_id")) {
      query.where(
        "vendor_competitive_dynamics.vendor_id",
        request.input("vendor_id")
      );
    }
    query.distinct("vendor_competitive_dynamics.market");
    market = await query.fetch()
    return response.status(200).send(market);
  }

  async show({ params, response }) {
    const query = VendorCompetitiveDynamic.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorCompetitiveDynamic.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.bubble_name = request.input("bubble_name");
    query.bubble_size = request.input("bubble_size");
    query.bubble_x = request.input("bubble_x");
    query.bubble_y = request.input("bubble_y");
    query.bubble_color = request.input("bubble_color");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.market = request.input("market");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorCompetitiveDynamic.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response
        .status(423)
        .send({
          message: "Something went wrong",
        });
    }
  }
}

module.exports = VendorCompetitiveDynamicController;
