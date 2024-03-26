"use strict";
const Partner = use("App/Models/Admin/PartnerModule/Partner");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const searchInFields = ["id", "name", "website"];

const requestOnly = [
  "name",
  "website",
  "image",
  "country_id",
  "itmap_rating",
  "org_size",
  "partner_type_id",
];
/**
 * Resourceful controller for interacting with partnerlists
 */
class PartnerListController {
  /**
   * Show a list of all partnerlists.
   * GET partnerlists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = Partner.query();
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
   * Render a form to be used for creating a new partnerlist.
   * GET partnerlists/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) { }

  /**
   * Create/save a new partnerlist.
   * POST partnerlists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    const query = await Partner.create(body);
    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));
    await query.vendors().detach();
    await query.vendors().attach(JSON.parse(request.input("vendors")));
    await query.save();
    await query.countries().attach(JSON.parse(request.input("countries")));
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single partnerlist.
   * GET partnerlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = Partner.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    const modulesIds = await result.modules().ids();
    result.modules = modulesIds;
    const vendorsIds = await result.vendors().ids();
    result.vendors = vendorsIds;
    const countryiesId = await result.countries().ids();
    result.countries = countryiesId;
    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing partnerlist.
   * GET partnerlists/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) { }

  /**
   * Update partnerlist details.
   * PUT or PATCH partnerlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await Partner.findOrFail(params.id);
    query.merge(body);
    await query.save();
    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));
    await query.save();
    await query.vendors().detach();
    await query.vendors().attach(JSON.parse(request.input("vendors")));
    await query.save();
    await query.countries().detach();
    await query.countries().attach(JSON.parse(request.input("countries")));
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  /**
   * Delete a partnerlist with id.
   * DELETE partnerlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await Partner.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async exportReport({ request, response, view }) {

    const query = Partner.query();
    query.leftJoin('partner_types', 'partner_types.id', 'partners.partner_type_id')
    query.select('partner_types.name as partner_type');

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

    var result = await query.fetch()

    const fileName = "vendor-partners-" + moment().format('yyyy-MM-DD') + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Blog List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {

        exportData.push({
          sno: index++,
          name: element.name,
          website: element.website,
          org_size: element.org_size,
          partner_type: element.partner_type,
          itmap_rating: element.itmap_rating,
          created: element.created_at,
          updated: element.updated_at,
        });
      });


    }


    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "Partner Name", key: "name", width: 30, style: { font: font } },
      { header: "Website", key: "website", width: 40, style: { font: font } },
      { header: "Organization Size", key: "org_size", width: 30, style: { font: font } },
      { header: "Partner Type", key: "partner_type", width: 30, style: { font: font } },
      { header: "ITMAP Rating", key: "itmap_rating", width: 30, style: { font: font } },
      { header: "Created", key: "created_at", width: 30, style: { font: font } },
      { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };


    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

}

module.exports = PartnerListController;
