"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantChatHistory extends Model {
  visitor() {
    return this.belongsTo(
      "App/Models/Admin/VisitorModule/Visitor",
      "visitor_id",
      "id"
    );
  }

  consultant() {
    return this.hasOne(
      "App/Models/Admin/ConsultantModule/Consultant",
      "consultant_id",
      "id"
    );
  }

  static get dates() {
    return super.dates.concat([
      "created_at",
      "updated_at",
      "chat_active_deadline",
    ]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at", "chat_active_deadline"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = ConsultantChatHistory;
