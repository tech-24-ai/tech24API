"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantsSchema extends Schema {
  up() {
    this.create("consultants", (table) => {
      table.increments();
      table.string("first_name", 100);
      table.string("middle_name", 100).nullable();
      table.string("last_name", 100).nullable();
      table.string("email", 254).notNullable().unique();
      table.string("mobile", 10).nullable();
      table.text("image").nullable();
      table.string("tags", 150).nullable();
      table.text("profile_summary").nullable();
      table.text("details").nullable();
      table
        .integer("country_id")
        .unsigned()
        .references("id")
        .inTable("countries")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.text("linkedin_url").nullable();
      table.decimal("avg_rating", 10, 2).unsigned();
      table
        .enu("status", ["Active", "Inactive", "Pending"])
        .defaultTo("Pending");
      table.integer("user_id").unsigned().defaultTo(0);
      table.decimal("total_payment", 10, 2).unsigned().defaultTo(0);
      table.boolean("is_company").defaultTo(false);
      table.integer("number_of_employee").unsigned().defaultTo(0);
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_technologies", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("name", 150).nullable();
      // table
      //   .integer("module_id")
      //   .unsigned()
      //   .references("id")
      //   .inTable("modules")
      //   .onDelete("cascade")
      //   .onUpdate("cascade");
      // table
      //   .integer("category_id")
      //   .unsigned()
      //   .references("id")
      //   .inTable("categories")
      //   .onDelete("cascade")
      //   .onUpdate("cascade");
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_skills", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("parent_id").nullable();
      table.string("name", 150).nullable();
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_regions", (table) => {
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("country_id").unsigned();
      // .references("id")
      // .inTable("countries")
      // .onDelete("cascade")
      // .onUpdate("cascade");
      table
        .integer("country_group_id")
        .unsigned()
        .references("id")
        .inTable("country_groups")
        .onDelete("cascade")
        .onUpdate("cascade");
    });
    this.create("consultant_work_experiences", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.date("from_year");
      table.date("to_year");
      table.boolean("is_present").defaultTo(false);
      table.string("company_name", 100).nullable();
      table.text("company_logo").nullable();
      table.string("designation", 100).nullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("consultants");
    this.drop("consultant_technologies");
    this.drop("consultant_regions");
    this.drop("consultant_work_experiences");
  }
}

module.exports = ConsultantsSchema;
