"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantSearchLogsSchema extends Schema {
  up() {
    this.create("consultant_search_logs", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("restrict");
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("cascade")
        .onUpdate("restrict");
      table.datetime("search_date");
      table.timestamps();
    });
  }

  down() {
    this.drop("consultant_search_logs");
  }
}

module.exports = ConsultantSearchLogsSchema;
