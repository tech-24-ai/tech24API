"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class DonationsSchema extends Schema {
  up() {
    this.create("donations", (table) => {
      table.increments();
      table
        .integer("user_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.decimal("donation_amount", 10, 2);
      table.text("payment_date");
      table.text("transaction_details");
      table.text("remark");
      table.timestamps();
    });
  }

  down() {
    this.drop("donations");
  }
}

module.exports = DonationsSchema;
