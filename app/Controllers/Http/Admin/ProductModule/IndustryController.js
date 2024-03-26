"use strict";

const Industry = use("App/Models/Admin/ProductModule/Industry");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const searchInFields = ["industries.id", "industries.name", "parent.name"];
class IndustryController {
  async index({ request, response }) {
    const query = Industry.query();
    query.select("industries.*");
    query.select("parent.name as parent_name");
    query.leftJoin("industries as parent", "parent.id", "industries.parent_id");

    if (request.input("all")) {
      query.whereNot("industries.parent_id", null);
    }
    if (request.input("onlyParent")) {
      query.where("industries.parent_id", null);
    }

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
        if (filter.name == "parent_name") {
          query.whereRaw(`parent.name LIKE '%${filter.value}%'`);
        } else {
          query.whereRaw(`industries.${filter.name} LIKE '%${filter.value}%'`);
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

  async store({ request, response }) {
    const query = new Industry();
    query.name = request.input("name");
    query.parent_id = request.input("parent_id");
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = Industry.query();

    query.select("industries.*");
    query.select("parent.name as parent");
    query.leftJoin("industries as parent", "parent.id", "industries.parent_id");
    query.where("industries.id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await Industry.findOrFail(params.id);
    query.name = request.input("name");
    query.parent_id = request.input("parent_id");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await Industry.findOrFail(params.id);

    const isIndustryConnectedToVendor = await IndustryVendor.findBy(
      "industry_id",
      params.id
    );

    if (isIndustryConnectedToVendor) {
      return response.status(200).send({
        message: "Couldn't delete industry, It's connected to vendor",
      });
    }

    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async exportReport({ request, response }) {
    const query = Industry.query();
    query.select("industries.*");
    query.select("parent.name as parent_name");
    query.leftJoin("industries as parent", "parent.id", "industries.parent_id");

    if (request.input("all")) {
      query.whereNot("industries.parent_id", null);
    }
    if (request.input("onlyParent")) {
      query.where("industries.parent_id", null);
    }

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
        if (filter.name == "parent_name") {
          query.whereRaw(`parent.name LIKE '%${filter.value}%'`);
        } else {
          query.whereRaw(`industries.${filter.name} LIKE '%${filter.value}%'`);
        }
      });
    }

    var result = await query.fetch();

    const fileName = "industries-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Industry List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        exportData.push({
          sno: index++,
          name: element.name,
          parent: element.parent_name,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "Industry", key: "name", width: 30, style: { font: font } },
      {
        header: "Parent Industry",
        key: "parent_name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Created",
        key: "created_at",
        width: 30,
        style: { font: font },
      },
      {
        header: "Updated",
        key: "updated_at",
        width: 30,
        style: { font: font },
      },
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

module.exports = IndustryController;
