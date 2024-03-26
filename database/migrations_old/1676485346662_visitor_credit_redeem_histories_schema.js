"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class VisitorCreditRedeemHistoriesSchema extends Schema {
  up() {
    this.create("visitor_credit_redeem_histories", (table) => {
      table.increments();
      table.integer("booking_id").unsigned();
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("booking_log_id").unsigned();
      table.integer("credit_used");
      table.integer("credit_booked");
      table.integer("credit_returned");
      table.integer("initial_credit_balance");
      table.integer("current_credit_balance");
      table.enu("type", ["Credit", "Debit"]);
      table.timestamps();
    });
  }

  down() {
    this.drop("visitor_credit_redeem_histories");
  }
}

module.exports = VisitorCreditRedeemHistoriesSchema;
