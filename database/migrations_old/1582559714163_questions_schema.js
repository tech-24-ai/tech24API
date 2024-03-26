"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class QuestionsSchema extends Schema {
  up() {
    this.create("questions", (table) => {
      table.increments();
      table
        .integer("step_id")
        .unsigned()
        .references("id")
        .inTable("steps")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.enu("option_type", [
        "textbox",
        "radiobox",
        "multi_radiobox",
        "checkbox",
        "select",
        "multi_select",
        "country_select",
        "industry_select",
      ]);
      table.string("name", "text");
      table.text("tags", "text").nullable();
      table.text("notes", "text").nullable();
      table.integer("isNotSure");
      table.timestamps();
    });
  }

  down() {
    this.drop("questions");
  }
}

module.exports = QuestionsSchema;
