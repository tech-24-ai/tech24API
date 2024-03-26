"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class SkillsSchema extends Schema {
  up() {
    this.create("skills", (table) => {
      table.increments();
      table.integer("parent_id").nullable();
      table.text("name").notNullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("skills");
  }
}

module.exports = SkillsSchema;
