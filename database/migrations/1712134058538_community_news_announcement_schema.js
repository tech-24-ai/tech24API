'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityNewsAnnouncementSchema extends Schema {
  up () {
    this.create('community_news_announcements', (table) => {
      table.increments()
      table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("cascade").onUpdate("cascade");
      table.string("title").nullable();
      table.text('description').nullable()
      table.boolean("status").defaultTo(true).comment(" 1 - Active, 0 - In-active ");
	  table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
	  table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
      table.timestamps()
    })
  }

  down () {
    this.drop('community_news_announcements')
  }
}

module.exports = CommunityNewsAnnouncementSchema
