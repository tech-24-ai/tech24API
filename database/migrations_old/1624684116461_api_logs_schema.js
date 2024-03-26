"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ApIlogsSchema extends Schema {
  up() {
    this.create("api_logs", (table) => {
      table.increments();
      table.string("api_type");
      table.integer("vendor_id");
      table.integer("user_id");
      table.timestamps();
    });
  }

  down() {
    this.drop("ap_ilogs");
  }
}

module.exports = ApIlogsSchema;
