"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class VisitorCreditHistory extends Model {
  visitor() {
    return this.belongsTo(
      "App/Models/Admin/VisitorModule/Visitor",
      "visitor_id",
      "id"
    );
  }
  purchase() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/CreditPurchaseDetail",
      "visitor_id",
      "id"
    );
  }
  static get createdAtColumn() {
    return null;
  }

  static get updatedAtColumn() {
    return null;
  }
}

module.exports = VisitorCreditHistory;
