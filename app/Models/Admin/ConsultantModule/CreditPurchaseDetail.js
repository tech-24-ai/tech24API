"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class CreditPurchaseDetail extends Model {
  visitor() {
    return this.belongsTo(
      "App/Models/Admin/VisitorModule/Visitor",
      "visitor_id",
      "id"
    );
  }

  invoices() {
    return this.hasOne(
      "App/Models/Admin/VisitorSubscriptionModule/Euinvoice",
      "id",
      "credit_purchase_detail_id"
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

module.exports = CreditPurchaseDetail;
