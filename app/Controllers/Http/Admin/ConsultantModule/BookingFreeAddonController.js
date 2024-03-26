"use strict";

const { getProfile } = require("../../../../Helper/consultant");
const Database = use("Database");
const Query = use("Query");
const Excel = require("exceljs");
const moment = require("moment");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const BookingFreeAddon = use(
  "App/Models/Admin/ConsultantModule/BookingFreeAddon"
);

const requestOnly = [
  "duration",
  "module_id",
  "category_id",
  "document_id",
  "type",
];

const searchInFields = ["duration", "type"];

class BookingFreeAddonController {
  async index({ request, response, view }) {
    const query = BookingFreeAddon.query();

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("modules", (builder) => {
      builder.select("id", "category_id", "name");
    });

    query.with("categories", (builder) => {
      builder.select("id", "name", "detail");
    });
    query.with("document", (builder) => {
      builder.select(
        "id",
        "document_type_id",
        "name",
        "description",
        "subscription_category",
        "document_category",
        "extension",
        "is_embedded"
      );
    });
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
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

  async store({ request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    await BookingFreeAddon.create({
      ...body,
      created_by: userId,
      updated_by: userId,
    });

    return response.status(200).json({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = BookingFreeAddon.query();
    query.where("id", params.id);
    query.with("technologies", (builder) => {
      builder.select("id", "consultant_id", "name");
    });
    // query.with("categories", (builder) => {
    //   builder.select("id", "name", "detail");
    // });
    query.with("document", (builder) => {
      builder.select(
        "id",
        "document_type_id",
        "name",
        "description",
        "subscription_category",
        "document_category",
        "extension",
        "is_embedded"
      );
    });
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    const query = await BookingFreeAddon.findOrFail(params.id);
    query.updated_by = userId;
    query.merge(body);
    await query.save();

    return response.status(200).json({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {}
  async exportReport({ params, request, response, auth }) {
    const query = BookingFreeAddon.query();

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("technologies", (builder) => {
      builder.select("id", "consultant_id", "name");
    });
    // query.with("categories", (builder) => {
    //   builder.select("id", "name", "detail");
    // });
    query.with("document", (builder) => {
      builder.select(
        "id",
        "document_type_id",
        "name",
        "description",
        "subscription_category",
        "document_category",
        "extension",
        "is_embedded"
      );
    });
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    const result = (await query.fetch()).toJSON();
    let exportData = [];
    let index = 1;

    const fileName =
      "booking-free-addons-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Booking Free Addons List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        // let module = element.modules.name;
        // let categories = element.categories.name;
        let technologies = element.technologies.name;
        let document = element.document.name;

        exportData.push({
          sno: index++,
          type: element.type,
          duration: element.duration,
          // module: module,
          // category: categories,
          technology: technologies,
          document: document,
          created_at: element.created_at,
          updated_at: element.updated_at,
        });
      });
    }

    // return response.send(exportData);

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Document Name",
        key: "document",
        width: 60,
        style: { font: font },
      },
      {
        header: "Module Name",
        key: "module",
        width: 60,
        style: { font: font },
      },
      {
        header: "Category Name",
        key: "category",
        width: 60,
        style: { font: font },
      },
      {
        header: "Duration",
        key: "duration",
        width: 20,
        style: { font: font },
      },
      {
        header: "Type",
        key: "type",
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

    worksheet.getColumn(4).alignment = { wrapText: true };
    worksheet.getColumn(7).alignment = { wrapText: true };
    worksheet.columns = columns;
    worksheet.addRows(exportData);

    // worksheet.getCell("B1", "C1").fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   fgColor: { argb: "cccccc" },
    // };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
}

module.exports = BookingFreeAddonController;
