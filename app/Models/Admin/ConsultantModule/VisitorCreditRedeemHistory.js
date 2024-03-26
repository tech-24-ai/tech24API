"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class VisitorCreditRedeemHistory extends Model {
  visitor() {
    return this.belongsTo(
      "App/Models/Admin/VisitorModule/Visitor",
      "visitor_id",
      "id"
    );
  }

  booking() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/BookingHistory",
      "booking_id",
      "id"
    );
  }
  booking_log() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/BookingLog",
      "booking_log_id",
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

module.exports = VisitorCreditRedeemHistory;
