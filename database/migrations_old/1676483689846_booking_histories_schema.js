"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class BookingHistoriesSchema extends Schema {
  up() {
    this.create("booking_histories", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("visitor_time_zone_id")
        .unsigned()
        .references("id")
        .inTable("time_zones")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.decimal("amount_per_hour", 10, 2).unsigned();
      table.date("booking_date").nullable();
      table.time("booking_time");
      table.string("booking_utc_time");
      table.integer("duration");
      table.text("skill").nullable();
      table.string("meeting_link", 100).nullable();
      table
        .enu("booking_status", ["Confirmed", "Cancelled", "Scheduled"])
        .defaultTo("Confirmed");
      table.string("zoom_meeting_id", 100).nullable();
      table.text("remarks").nullable();
      table.boolean("is_credit").defaultTo(false);
      table.timestamps();
    });
    this.create("booking_transaction_histories", (table) => {
      table.increments();
      table
        .integer("booking_history_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.enu("type", ["Online", "Offline", "Credit"]).defaultTo("Online");
      table.decimal("sub_amount", 10, 2);
      table.decimal("taxes", 10, 2);
      table.decimal("total_amount", 10, 2);
      table.string("paypal_transaction_id", 100).nullable();
      table.timestamp("transaction_date", { useTz: true });
      table.text("transaction_details").nullable();
      table.timestamps();
    });
    this.create("booking_logs", (table) => {
      table.increments();
      table
        .integer("booking_history_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.time("start_time");
      table.time("end_time");
      table.integer("total_duration");
      table.boolean("is_credit").defaultTo(false);
      table.decimal("total_billing", 10, 2);
      table.decimal("penalty", 10, 2);
      table.decimal("refund", 10, 2);
      table.text("meeting_transcript").nullable();
      table
        .enu("meeting_status", ["Running", "Completed", "Cencelled"])
        .defaultTo("Running");
      table.timestamps();
    });
    this.create("booking_refund_requests", (table) => {
      table.increments();
      table
        .integer("booking_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("paypal_transaction_id", 100).nullable();
      table.decimal("refund_amount", 10, 2);
      table.decimal("approved_amount", 10, 2);
      table.string("reason", 100).nullable();
      table
        .enu("refund_status", ["Process", "Failed", "Refunded"])
        .defaultTo("Process");
      table.string("admin_remarks", 100).nullable();
      table.string("refund_transaction_id", 100).nullable();
      table.enu("refund_by", ["Visitor", "Consultant"]);
      table.datetime("refund_date");
      table.timestamps();
    });
    this.create("consultant_ratings", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors");
      table
        .integer("booking_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("rating");
      table.string("review", 100).nullable();
      table
        .enu("status", ["Pending", "Approved", "Rejected"])
        .defaultTo("Pending");
      table.timestamps();
    });
  }

  down() {
    this.drop("booking_histories");
    this.drop("booking_transaction_histories");
    this.drop("booking_logs");
    this.drop("booking_refund_requests");
    this.drop("consultant_ratings");
  }
}

module.exports = BookingHistoriesSchema;
