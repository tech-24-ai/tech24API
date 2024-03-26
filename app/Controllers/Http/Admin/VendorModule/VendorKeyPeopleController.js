"use strict";
const VendorKeyPeoples = use("App/Models/Admin/VendorModule/VendorKeyPeoples");
const Excel = require("exceljs");
const Database = use("Database");
const Config = use("App/Models/Admin/ConfigModule/Config");
const Query = use("Query");
const moment = require("moment");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const searchInFields = [
  "id",
  "name",
  "designation",
  "photo",
  "vendor_id",
  "twitter_link",
  "linkedin_link",
  "instagram_link",
  "is_board_of_directors",
  "is_executive_managment",
  "is_active",
]
const requestOnly = [
  "name",
  "designation",
  "photo",
  "vendor_id",
  "twitter_link",
  "linkedin_link",
  "instagram_link",
  "is_board_of_directors",
  "is_executive_managment",
  "is_active",
  "start_date",
  "end_date",
];
/**
 * Resourceful controller for interacting with keypeople
 */
class KeyPersonController {
  /**
   * Show a list of all keypeople.
   * GET keypeople
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ params, request, response, view }) {
    const query = VendorKeyPeoples.query();
    query.where("vendor_id", params.vendor_id);
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
   * Render a form to be used for creating a new keyperson.
   * GET keypeople/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) { }

  /**
   * Create/save a new keyperson.
   * POST keypeople
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    var body = request.only(requestOnly);
    await VendorKeyPeoples.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  /**
   * Display a single keyperson.
   * GET keypeople/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = VendorKeyPeoples.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }
  /**
   * Update keyperson details.
   * PUT or PATCH keypeople/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await VendorKeyPeoples.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await VendorKeyPeoples.query().delete().whereIn("id", ids);

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  /**
   * Delete a keyperson with id.
   * DELETE keypeople/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await VendorKeyPeoples.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }


  async import({ request, response }) {

    await Database.raw("SET FOREIGN_KEY_CHECKS = 0;");
    let vendor_id = request.input("id")
    const validationOptions = {
      types: [
        "csv",
        "xls",
        "xlsx",
        'vnd.ms-excel',
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
    let dataArray = [];

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }


      let executives = await Config.query()
        .where("key", "KeyPeopleTitles")
        .pluck("value");

      let exetitles = executives[0].split(",");

      var workbook = new Excel.Workbook();

      workbook = await workbook.csv.read(file.stream);

      let rowData;
      let dataArray = [];
      workbook.eachRow(
        { includeEmpty: true },
        async function (row, rowNumber) {
          rowData = JSON.parse(JSON.stringify(row.values));

          if (rowData && rowData.length > 0 && rowNumber !== 1) {

            let name = '';
            let title = '';
            let linkedinurl = '';
            let profileImageUrl = '';

            if (rowData[2]) {
              if (typeof rowData[2] === "string") {
                name = rowData[2];
              } else {
                name = rowData[2].text;
              }
            }

            if (rowData[6]) {
              if (typeof rowData[6] === "string") {
                title = rowData[6];
              } else {
                title = rowData[6].text;
              }
            }

            if (rowData[17]) {
              profileImageUrl = rowData[17];
            }

            if (rowData[21]) {

              linkedinurl = rowData[25];
            }


            let is_executive = false;
            let is_bom = false;
            let index = 0;

            for (index = 0; index < exetitles.length; index++) {

              let systemtitle = (exetitles[index]).trim();

              if (title == systemtitle) {
                is_executive = true;
                break;
              }
            }

            if (title.includes("Board of Member") || title.includes("Board of Members") || title.includes("Board")) {
              if (!title.includes("former")) {
                is_bom = true;
              }
            }

            const bodyData = {

              vendor_id: request.input("id"),
              name: name,
              photo: profileImageUrl,
              designation: title,
              twitter_link: '',
              linkedin_link: linkedinurl,
              is_board_of_directors: is_bom,
              is_executive_managment: is_executive,
              is_active: true,
              start_date: '',
              end_date: '',

            };
            
            dataArray.push(bodyData);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const query = await VendorKeyPeoples.findByOrFail('linkedin_link', bodyData.linkedin_link);
              query.vendor_id = bodyData.vendor_id;
              query.photo = bodyData.photo;
              query.designation = bodyData.designation;
              await query.save();

            } catch (Ex) {

              await VendorKeyPeoples.create(bodyData);
            }



          }

        }
      );
    });

    await request.multipart.process();

    await Database.raw("SET FOREIGN_KEY_CHECKS = 1;");

    //Delete all any profile which is not available in the result.json
    const allKeyPeoplequery = await VendorKeyPeoples.query().where("vendor_id", vendor_id).fetch();

    const allKeypeople = allKeyPeoplequery.toJSON();
    let allKeypeoplelength = allKeypeople.length;
    let i = 0;
    for (i = 0; i < allKeypeople.length; i++) {

      let j = 0;
      for (j = 0; j < dataArray.length; j++) {
        if (allKeypeople[i].linkedin_link == dataArray[j].linkedin_link) {
          break;
        }
      }
      if (j == dataArray.length) {
        const query = await VendorKeyPeoples.findOrFail(allKeypeople[i].id);
        try {
          await query.delete();

        } catch (error) {

        }
      }
    }

    return response
      .status(200)
      .send({ message: "Create successfully" });
  }

}

module.exports = KeyPersonController;