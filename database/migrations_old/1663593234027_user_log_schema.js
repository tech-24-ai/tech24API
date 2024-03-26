"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class UserLogSchema extends Schema {
  up() {
    this.create("user_logs", (table) => {
      table.increments();
      table.integer("user_id");
      table.string("ip").nullable();
      table.string("country").nullable();
      table.string("city").nullable();
      table.string("register_from").nullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("user_logs");
  }
}

module.exports = UserLogSchema;
