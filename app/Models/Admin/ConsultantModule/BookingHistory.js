"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class BookingHistory extends Model {
  transaction() {
    return this.hasOne(
      "App/Models/Admin/ConsultantModule/BookingTransactionHistory",
      "id",
      "booking_history_id"
    );
  }

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

  rate_card() {
    return this.hasOne(
      "App/Models/Admin/ConsultantModule/ConsultantRateCard",
      "consultant_rate_card_id",
      "id"
    );
  }

  chat_history() {
    return this.hasOne(
      "App/Models/Admin/ConsultantModule/ConsultantChatHistory",
      "id",
      "booking_id"
    );
  }

  timezone() {
    return this.hasOne(
      "App/Models/Admin/LocationModule/TimeZone",
      "visitor_time_zone_id",
      "id"
    );
  }

  invoices() {
    return this.hasOne(
      "App/Models/Admin/VisitorSubscriptionModule/Euinvoice",
      "id",
      "booking_history_id"
    );
  }
  static get dates() {
    return super.dates.concat(["created_at", "updated_at", "booking_date"]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at", "booking_date"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = BookingHistory;
