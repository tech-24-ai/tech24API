"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class VisitorCreditHistoriesSchema extends Schema {
  up() {
    this.create("visitor_credit_histories", (table) => {
      table.increments();
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("credit");
      table.date("valid_till").nullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("visitor_credit_histories");
  }
}

module.exports = VisitorCreditHistoriesSchema;
