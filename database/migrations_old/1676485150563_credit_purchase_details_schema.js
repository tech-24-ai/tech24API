"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class CreditPurchaseDetailsSchema extends Schema {
  up() {
    this.create("credit_purchase_details", (table) => {
      table.increments();
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.decimal("amount_paid", 10, 2);
      table.integer("purchased_credit");
      table.string("paypal_transcation_id", 100).nullable();
      table.datetime("purchase_date").nullable();
      table.text("transaction_details").nullable();
      table.enu("type", ["Online", "Offline"]);
      table.timestamps();
    });
  }

  down() {
    this.drop("credit_purchase_details");
  }
}

module.exports = CreditPurchaseDetailsSchema;
