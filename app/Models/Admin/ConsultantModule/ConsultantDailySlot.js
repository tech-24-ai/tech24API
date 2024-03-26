"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantDailySlot extends Model {
  static get hidden() {
    return ["created_by", "updated_by"];
  }

  consultant() {
    return this.belongsTo("App/Models/Admin/ConsultantModule/Consultant");
  }

  static get dates() {
    return super.dates.concat(["created_at", "updated_at", "date"]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at", "date"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    // if (field === "date") {
    //   return moment(value).format("DD-MM-YYYY");
    // }

    return super.formatDates(field, value);
  }
}

module.exports = ConsultantDailySlot;
