"use strict";

const VendorGoogleTrend = use("App/Models/VendorGoogleTrend");
const Database = use("Database");

const Query = use("Query");
const moment = require("moment");

const searchInFields = ["trends_score", "date", "year"];
const { formatMonthlyResponse } = require("../../Helper/stats");
class VendorGoogleTrendController {
  async index({ request, response }) {
    const query = VendorGoogleTrend.query();
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
    const query = new VendorGoogleTrend();

    query.vendor_id = request.input("vendor_id");
    query.trends_score = request.input("trends_score");
    query.date = request.input("date");
    query.year = request.input("year");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorGoogleTrend.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorGoogleTrend.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.trends_score = request.input("trends_score");
    query.date = request.input("date");
    query.year = request.input("year");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorGoogleTrend.findOrFail(params.id);
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
    const result = await Database.raw(
      "select ROUND(AVG(trends_score)) as trends_score,date,year,DATE_FORMAT(date, '%b') as month from vendor_google_trends  where vendor_id = (?) and year >= (?) group by MONTH(`date`)",
      [params.id,moment().subtract(3,'years').format('yyyy')]
    );

    return response
      .status(200)
      .send(
        formatMonthlyResponse(JSON.parse(JSON.stringify(result[0])), [
          { field: "trends_score", action: "mean" },
        ])
      );
  }
}

module.exports = VendorGoogleTrendController;
