"use strict";
const ConsultantChatHistory = use(
  "App/Models/Admin/ConsultantModule/ConsultantChatHistory"
);
const User = use("App/Models/Admin/UserModule/User");
const Role = use("App/Models/Admin/UserModule/Role");
const Database = use("Database");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getProfile } = require("../../../../Helper/consultant");

const requestOnly = [
  "booking_id",
  "consultant_id",
  "visitor_id",
  "allow_consultant_message",
  "allow_visitor_message",
  "chat_active_deadline",
];

const searchInFields = [
  "chat_active_deadline",
  "visitor.name",
  "consultant.first_name",
];
class ConsultantChatHistoryController {
  async index({ request, response, view, auth }) {
    const query = ConsultantChatHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const consultantId = request.input("consultant_id");
    const user = await getProfile(auth);

    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("consultant", (builder) => {
      builder.select(
        "id",
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "mobile",
        "image"
      );
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
    if (search) {
      query.whereRaw(`LOWER(chat_active_deadline) LIKE '%${search}%'`)
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

          case "visitor.name": {
            query
              .join(
                "visitors",
                "consultant_chat_histories.visitor_id",
                "=",
                "visitors.id"
              )
              .where("visitors.name", "LIKE", `%${filter.value}%`);
            break;
          }

          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("consultant_id", consultantId);
    }
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
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
    const body = request.only(requestOnly);
    await ConsultantChatHistory.create(body);
    return response.status(200).json({ message: "Create successfull" });
  }

  async show({ params, request, response, view, auth }) {
    const user = await getProfile(auth);
    const query = ConsultantChatHistory.query();
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    const result = await query.firstOrFail();
    return response.status(200).json(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const user = await getProfile(auth);
    const query = await ConsultantChatHistory.findOrFail(params.id);
    query.merge(body);
    await query.save();
    return response.status(200).json({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {}
}

module.exports = ConsultantChatHistoryController;
