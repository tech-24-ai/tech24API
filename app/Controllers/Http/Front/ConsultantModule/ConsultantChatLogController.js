"use strict";
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const ConsultantChatHistory = use(
  "App/Models/Admin/ConsultantModule/ConsultantChatHistory"
);
const ConsultantChatLog = use(
  "App/Models/Admin/ConsultantModule/ConsultantChatLog"
);

const requestOnly = ["chat_id", "message"];
const searchInFields = ["message"];

class ConsultantChatLogController {
  async index({ request, response, view, auth }) {
    const query = ConsultantChatLog.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const chat_id = request.input("chat_id");

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
                name: "updated_at",
                date: filter.value,
              })
            );
            break;
          case "message_datetime":
            query.whereRaw(
              await dateFilterExtractor({
                name: "message_datetime",
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

    if (chat_id) {
      query.where("chat_id", chat_id);
    }

    const result = await query.fetch();

    return response.status(200).send(result);
  }

  async store({ request, response, view, auth }) {
    const body = request.only(requestOnly);
    try {
      const chatConfig = await ConsultantChatHistory.find(body.chat_id);
      if (chatConfig.allow_visitor_message) {
        const query = await ConsultantChatLog.create({
          ...body,
          created_by: auth.user.id,
          message_by: "Visitor",
        });

        return response
          .status(200)
          .json({ message: "Create successfully", data: query });
      } else {
        return response
          .status(423)
          .json({ message: "You are not allowed to response the chat" });
      }
    } catch (error) {
      return response.status(423).json({ message: "Something went wrong" });
    }
  }
  async show({ params, request, response, view }) {}

  async edit({ params, request, response, view }) {}

  async update({ params, request, response }) {}

  async destroy({ params, request, response }) {}
}

module.exports = ConsultantChatLogController;
