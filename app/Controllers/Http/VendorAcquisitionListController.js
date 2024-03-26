"use strict";

const VendorAcquisitionList = use("App/Models/VendorAcquisitionList");

const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "logo_acquried_company",
  "acquired_company_name",
  "date_of_acquisition",
  "currency",
  "acquired_amount",
];

class VendorAcquisitionListController {
  async index({ request, response }) {
    const query = VendorAcquisitionList.query();
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
    const query = new VendorAcquisitionList();

    query.vendor_id = request.input("vendor_id");
    query.logo_acquried_company = request.input("logo_acquried_company");
    query.acquired_company_name = request.input("acquired_company_name");
    query.date_of_acquisition = request.input("date_of_acquisition");
    query.currency = request.input("currency");
    query.acquired_amount = request.input("acquired_amount");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorAcquisitionList.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorAcquisitionList.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.logo_acquried_company = request.input("logo_acquried_company");
    query.acquired_company_name = request.input("acquired_company_name");
    query.date_of_acquisition = request.input("date_of_acquisition");
    query.currency = request.input("currency");
    query.acquired_amount = request.input("acquired_amount");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorAcquisitionList.findOrFail(params.id);
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

module.exports = VendorAcquisitionListController;
