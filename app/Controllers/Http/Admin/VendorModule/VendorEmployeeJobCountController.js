"use strict";
const VendorEmployeeJobCounts = use(
  "App/Models/Admin/VendorModule/VendorEmployeeJobCounts"
);
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Query = use("Query");
const moment = require("moment");
const { getYearQuarter } = require("../../../../Helper/stats");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const requestOnly = [
  "total_employee",
  "total_jobs",
  "year",
  "quarter",
  "vendor_id",
];

const searchInFields = [
  "id",
  "total_employee",
  "total_jobs",
  "year",
  "quarter",
  "vendor_id",
];
/**
 * Resourceful controller for interacting with vendoremployeejobcounts
 */
class VendorEmployeeJobCountController {
  /**
   * Show a list of all vendoremployeejobcounts.
   * GET vendoremployeejobcounts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorEmployeeJobCounts.query();
    query.where("vendor_id", params.vendor_id);
    query.orderBy("year", "desc");
    query.orderByRaw("FIELD(quarter,'ALL','Q4','Q3','Q2','Q1')");
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
   * Render a form to be used for creating a new vendoremployeejobcount.
   * GET vendoremployeejobcounts/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new vendoremployeejobcount.
   * POST vendoremployeejobcounts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorEmployeeJobCounts.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single vendoremployeejobcount.
   * GET vendoremployeejobcounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorEmployeeJobCounts.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  /**
   * Update vendoremployeejobcount details.
   * PUT or PATCH vendoremployeejobcounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorEmployeeJobCounts.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a vendoremployeejobcount with id.
   * DELETE vendoremployeejobcounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorEmployeeJobCounts.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorEmployeeJobCounts.query()
      .delete()
      .whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  async incompleteJobCount({ request, response }) {
    let currentQuarter = getYearQuarter(new Date());
    const query = VendorEmployeeJobCounts.query();
    /*let lastQuarter = parseInt(currentQuarter.quarter[1]) - 1;
    if (lastQuarter <= 0) {
      currentQuarter.year = parseInt(currentQuarter.year) - 1;
      currentQuarter.quarter = "Q4";
    } else {
      currentQuarter.quarter = `Q${lastQuarter}`;
    }*/
    
    query.where("year", currentQuarter.year);
    query.where("quarter", currentQuarter.quarter);
    query.whereNull("total_jobs");
    const vendorIds = await query.pluck("vendor_id");
   
    const vendorQuery = Vendor.query();
    vendorQuery.select("id as company_id");
    vendorQuery.select("name");
    vendorQuery.select("linkedin_url");
    vendorQuery.whereNot("linkedin_url", '=','null');
    vendorQuery.whereIn("id", vendorIds);
    const data = await vendorQuery.fetch();
    return response.status(200).send(data);
  }

  async updateJobCount({ request, response }) {
    const data = request.input("data");
    let company_id = data.reduce(
      (prev, curr) => [...prev, curr.company_id],
      []
    );
    let currentQuarter = getYearQuarter(new Date());
    
    /*let lastQuarter = parseInt(currentQuarter.quarter[1]) - 1;
    if (lastQuarter <= 0) {
      currentQuarter.year = parseInt(currentQuarter.year) - 1;
      currentQuarter.quarter = "Q4";
    } else {
      currentQuarter.quarter = `Q${lastQuarter}`;
    }*/
    // Fetching existing data

    let result = [];
    let query = VendorEmployeeJobCounts.query();
    query.where("year", currentQuarter.year);
    query.where("quarter", currentQuarter.quarter);
    query.whereIn("vendor_id", company_id);
    let existingData = (await query.fetch()).toJSON();
    
    if (existingData && existingData.length) {
      
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        
        let vendorid = Number(element.company_id);
        let jobcount = ((element.job_count).trim()).replace(/,/g, '');
        
        if (existingData.find((x) => x.vendor_id === vendorid)) {
         
          await VendorEmployeeJobCounts.query()
            .where("year", currentQuarter.year)
            .where("quarter", currentQuarter.quarter)
            .where("vendor_id", element.company_id)
            .update({
              total_jobs: jobcount,
              //total_employee: element.total_employee,
            });
        } else {
          result.push({
            vendor_id: vendorid,
            total_jobs: jobcount,
            //total_employee: element.total_employee,
            ...currentQuarter,
          });
        }
      }
    } else {
      result = data.map((x) => ({
        vendor_id: Number(x.company_id),
        total_jobs: (x.job_count).trim(),
        //total_employee: x.total_employee,
        ...currentQuarter,
      }));
    }
    
    if (result && result.length)
      await VendorEmployeeJobCounts.createMany(result);

    return response.status(200).send({ message: "Save Successfully" });
  }
}

module.exports = VendorEmployeeJobCountController;
