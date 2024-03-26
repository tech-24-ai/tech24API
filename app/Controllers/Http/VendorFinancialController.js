"use strict";

const VendorFinancial = use("App/Models/VendorFinancial");
const financialService = require("../../services/financials.service");
const VendorEmployeeJobCounts = use(
  "App/Models/Admin/VendorModule/VendorEmployeeJobCounts"
);
const Query = use("Query");
const moment = require("moment");
const _ = require("lodash");
const { formatResponse } = require("../../Helper/stats");
const searchInFields = [
  "net_income",
  "total_assets",
  "total_liabilities",
  "total_equity",
  "financial_leverage",
  "debt_equity_ratio",
  "revenue",
  "p_e_ratio",
  "revenue_range",
  "year",
  "quarter",
  "source",
];

class VendorFinancialController {

  async index({ request, response,auth }) {


    const query = VendorFinancial.query();
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


  async frontend({ request, response }) {


    const query = VendorFinancial.query();
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

    query.where("year", ">=", moment().subtract(3,'years').format('yyyy'));

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
    const query = new VendorFinancial();

    query.vendor_id = request.input("vendor_id");
    query.net_income = request.input("net_income");
    query.total_assets = request.input("total_assets");
    query.total_liabilities = request.input("total_liabilities");
    query.total_equity = request.input("total_equity");
    query.financial_leverage = request.input("financial_leverage");
    query.debt_equity_ratio = request.input("debt_equity_ratio");
    query.revenue = request.input("revenue");
    query.p_e_ratio = request.input("p_e_ratio");
    query.revenue_range = request.input("revenue_range");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.source = request.input("source");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorFinancial.query();
    query.where("vendor_id", params.id);
    const result = await query.fetch();
    const stats = await financialService.getFinancialStats(params.id);
    return response.status(200).send(formatResponse(stats, result));
  }

  async stats({ params, response }) {
    const query = VendorFinancial.query();
    query.where("vendor_id", params.id);
    const result = await query.fetch();
    const stats = await financialService.getFinancialStats(params.id);
    return response.status(200).send(formatResponse(stats, result, "revenue"));
  }

  async graph({ request, response }) {
    const stats = await financialService.getStockGraph(request.input("vendor_id"), request.input("frequency")
    );
    return response.status(200).send(stats);
  }

  async update({ params, request, response }) {
    const query = await VendorFinancial.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.net_income = request.input("net_income");
    query.total_assets = request.input("total_assets");
    query.total_liabilities = request.input("total_liabilities");
    query.total_equity = request.input("total_equity");
    query.financial_leverage = request.input("financial_leverage");
    query.debt_equity_ratio = request.input("debt_equity_ratio");
    query.revenue = request.input("revenue");
    query.p_e_ratio = request.input("p_e_ratio");
    query.revenue_range = request.input("revenue_range");
    query.year = request.input("year");
    query.quarter = request.input("quarter");
    query.source = request.input("source");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorFinancial.findOrFail(params.id);
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

module.exports = VendorFinancialController;
