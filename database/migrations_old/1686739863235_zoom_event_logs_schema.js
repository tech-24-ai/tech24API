"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ZoomEventLogsSchema extends Schema {
  up() {
    this.create("zoom_event_logs", (table) => {
      table.increments();
      table.date("date").nullable();
      table.string("event", 150).nullable();
      table.text("payload").nullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("zoom_event_logs");
  }
}

module.exports = ZoomEventLogsSchema;
