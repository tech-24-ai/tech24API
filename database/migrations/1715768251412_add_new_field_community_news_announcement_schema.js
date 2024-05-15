"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class AddNewFieldCommunityNewsAnnouncementSchema extends Schema {
  up() {
    this.table("community_news_announcements", (table) => {
      table.text("short_description").nullable();
    });
  }

  down() {
    this.table("community_news_announcements");
    // reverse alternations
  }
}

module.exports = AddNewFieldCommunityNewsAnnouncementSchema;
