'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityVisitorLibrarySchema extends Schema {
  up () {
    this.create('community_visitor_libraries', (table) => {
      table.increments()
	  table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("cascade").onUpdate("cascade")
	  table.integer("document_id").unsigned().references("id").inTable("documents").onDelete("cascade").onUpdate("cascade")
	  table.integer("blog_id").unsigned().references("id").inTable("blogs").onDelete("cascade").onUpdate("cascade")
	  table.boolean("type").comment("1 - Market Research, 2 - Blog");
      table.timestamps()
    })
	
	this.table('categories', (table) => {
      // alter table
	  table.text("bg_image").nullable().after('bg_color');
    })
  }

  down () {
    this.drop('community_visitor_libraries')
  }
}

module.exports = CommunityVisitorLibrarySchema
