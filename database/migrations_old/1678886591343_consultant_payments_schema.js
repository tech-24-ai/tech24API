"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantPaymentsSchema extends Schema {
  up() {
    this.create("consultant_payments", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.decimal("total_payment", 10, 2);
      table.date("payment_date").nullable();
      table.text("transaction_details").nullable();
      table.text("remarks").nullable();
      table.timestamps();
    });

    this.create("consultant_payment_details", (table) => {
      table.increments();
      table
        .integer("consultant_payment_id")
        .unsigned()
        .references("id")
        .inTable("consultant_payments")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("booking_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onDelete("restrict")
        .onUpdate("cascade");
      table
        .integer("booking_logs_id")
        .unsigned()
        .references("id")
        .inTable("booking_logs")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.decimal("sub_total", 10, 2);
      table.decimal("taxes", 10, 2);
      table.decimal("deduction", 10, 2);
      table.decimal("net_payment", 10, 2);
      table.date("payment_date").nullable();
      table.string("deduction_reason", 150).nullable();
      table
        .enu("payment_status", ["Confirmed", "Failed"])
        .defaultTo("Confirmed");
      table.timestamps();
    });
  }

  down() {
    this.drop("consultant_payments");
    this.drop("consultant_payment_details");
  }
}

module.exports = ConsultantPaymentsSchema;
