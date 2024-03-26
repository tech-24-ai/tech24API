"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class Complaint extends Model {
  static get hidden() {
    return ["created_by", "updated_by"];
  }

  consultant() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/Consultant",
      "ref_id",
      "id"
    );
  }

  visitor() {
    return this.belongsTo(
      "App/Models/Admin/VisitorModule/Visitor",
      "ref_id",
      "id"
    );
  }

  static get dates() {
    return super.dates.concat(["created_at", "updated_at"]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = Complaint;
