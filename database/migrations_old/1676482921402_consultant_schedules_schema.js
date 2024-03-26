"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantSchedulesSchema extends Schema {
  up() {
    this.create("consultant_schedules", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("time_zone_id")
        .unsigned()
        .references("id")
        .inTable("time_zones")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.enu("type", ["Weekly", "Daily"]).defaultTo("Weekly");
      // table.string("timezone", 100).nullable();
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_daily_slots", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.date("date").nullable();
      table.time("start_time");
      table.time("end_time");
      table.boolean("is_available").defaultTo(true);
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_schedule_days", (table) => {
      table.increments();
      // table
      //   .integer("schedule_id")
      //   .unsigned()
      //   .references("id")
      //   .inTable("consultant_schedules")
      //   .onDelete("cascade")
      //   .onUpdate("cascade");
      table.enu("day_of_week", [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ]);
      // table.integer("created_by").unsigned().references("id").inTable("users");
      // table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_schedule_times", (table) => {
      table.increments();
      table
        .integer("schedule_id")
        .unsigned()
        .references("id")
        .inTable("consultant_schedules")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("schedule_days_id")
        .unsigned()
        .references("id")
        .inTable("consultant_schedule_days")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.time("start_time");
      table.time("end_time");
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
  }

  down() {
    this.drop("consultant_schedules");
    this.drop("consultant_daily_slots");
    this.drop("consultant_schedule_days");
    this.drop("consultant_schedule_times");
  }
}

module.exports = ConsultantSchedulesSchema;
