'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunitySchema extends Schema {
	up () {
		this.table('communities', (table) => {
			// alter table
			table.text("image_url").nullable().after('url_slug');
		})
		
		this.create('technologies', (table) => {
			table.increments();
			table.string("name").nullable();
			table.boolean("status").defaultTo(true).comment(" 1 - Active, 0 - In-active ");
			table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('visitor_technologies', (table) => {
			table.increments();
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.integer("technology_id").unsigned().references("id").inTable("technologies").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
	}

  down () {
    this.table('communities', (table) => {
      // reverse alternations
		this.drop('technologies');
		this.drop('visitor_technologies');
    })
  }
}

module.exports = CommunitySchema
