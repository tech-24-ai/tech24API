"use strict";

const VendorWebTraffic = use("App/Models/VendorWebTraffic");

const Query = use("Query");
const moment = require("moment");
const { formatMonthlyResponse } = require("../../Helper/stats");

const searchInFields = [
  "web_ranking",
  "page_views",
  "time_on_site",
  "month",
  "year",
];

class VendorWebTrafficController {
  async index({ request, response }) {
    const query = VendorWebTraffic.query();
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
    const query = new VendorWebTraffic();

    query.vendor_id = request.input("vendor_id");
    query.web_ranking = request.input("web_ranking");
    query.page_views = request.input("page_views");
    query.time_on_site = request.input("time_on_site");
    query.month = request.input("month");
    query.year = request.input("year");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorWebTraffic.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorWebTraffic.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.web_ranking = request.input("web_ranking");
    query.page_views = request.input("page_views");
    query.time_on_site = request.input("time_on_site");
    query.month = request.input("month");
    query.year = request.input("year");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorWebTraffic.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
 
  async stats({ params, response }) {
    const query = VendorWebTraffic.query();
    query.where("vendor_id", params.id);
    query.where("year", ">=", moment().subtract(3,'years').format('yyyy'));
    query.orderBy("month_id");
    const result = await query.fetch();
    return response.status(200).send(
      formatMonthlyResponse(result.toJSON(), [
        { field: "web_ranking", action: "sum" },
        { field: "page_view_per_million", action: "sum" },
        { field: "page_view_per_user", action: "sum" },
        { field: "reach_per_million", action: "sum" },
      ])
    );
  }
}

module.exports = VendorWebTrafficController;
