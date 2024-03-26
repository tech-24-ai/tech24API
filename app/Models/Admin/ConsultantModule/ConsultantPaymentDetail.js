"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantPaymentDetail extends Model {
  payment() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/ConsultantPayment",
      "consultant_payment_id",
      "id"
    );
  }

  static get dates() {
    return super.dates.concat(["created_at", "updated_at", "payment_date"]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at", "payment_date"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = ConsultantPaymentDetail;
