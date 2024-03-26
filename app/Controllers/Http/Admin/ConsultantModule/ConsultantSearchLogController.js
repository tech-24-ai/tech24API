"use strict";
const ConsultantSearchLog = use(
  "App/Models/Admin/ConsultantModule/ConsultantSearchLog"
);
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { KEYS } = require("../../../../Helper/constants");
const Database = use("Database");

const searchInFields = [
  "updated_at",
  "visitor.name",
  "consultant.first_name",
];
class ConsultantSearchLogController {
  async index({ request, response, view }) {
    const query = ConsultantSearchLog.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const consultantId = request.input("consultant_id");
    const searchQuery = new Query(request, { order: "id" });

    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "last_name", "image");
    });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "designation", "company", "profile_pic_url");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
    if (search) {
      query.whereRaw(`LOWER(updated_at) LIKE '%${search}%'`)
        .orWhereHas('visitor', builder => {
          builder.whereRaw(`LOWER(name) LIKE '%${search}%'`);
        })
        .orWhereHas('consultant', builder => {
          builder.whereRaw(`LOWER(first_name) LIKE '%${search}%'`);
        });
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
          case "search_date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "search_date",
                date: filter.value,
              })
            );
            break;

          case "visitor.name": {
            query
              .join(
                "visitors",
                "consultant_search_logs.visitor_id",
                "=",
                "visitors.id"
              )
              .where("visitors.name", "LIKE", `%${filter.value}%`);
            break;
          }

          case "consultant.first_name": {
            query
              .join(
                "consultants",
                "consultant_search_logs.consultant_id",
                "=",
                "consultants.id"
              )
              .where("consultants.first_name", "LIKE", `%${filter.value}%`);
            break;
          }

          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (consultantId) {
      query.where("consultant_id", consultantId);
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
    const trx = await Database.beginTransaction();
    try {
      const query = await ConsultantSearchLog.create(
        {
          consultant_id: request.input("consultant_id"),
          visitor_id: auth.user.id,
          search_date: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        trx
      );
      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }
}

module.exports = ConsultantSearchLogController;
