"use strict";

const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const ConsultantScheduleDay = use(
  "App/Models/Admin/ConsultantModule/ConsultantScheduleDay"
);

class ConsultantScheduleDayController {
  async index({ request, response, view }) {
    const query = ConsultantScheduleDay.query().select("id", "day_of_week");
    const result = (await query.fetch()).toJSON();
    return response.status(200).json(result);
  }

  async store({ request, response }) {
    try {
      await ConsultantScheduleDay.findOrCreate({
        day_of_week: request.input("day_of_week"),
      });
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      return response.status(423).json({ message: "Something wrong!", error });
    }
  }

  async show({ params, request, response, view }) {}

  async update({ params, request, response }) {}

  async destroy({ params, request, response }) {}
}

module.exports = ConsultantScheduleDayController;
