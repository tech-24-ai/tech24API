'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityVisitorSchema extends Schema {
  up () {
    this.table('community_visitors', (table) => {
      // alter table
	  table.dropForeign('community_post_id');
	  table.dropColumn("community_post_id");
	  table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("cascade").onUpdate("cascade").after("visitor_id"); 
	  table.boolean("status").defaultTo(1).comment("0 - Pending, 1 - Approve, 2 - Reject").after("community_id");
    })
	
	
    this.table('communities', (table) => {
      // alter table
	  table.boolean("type").defaultTo(0).comment("0 - Open, 1 - Restricted").after("image_url");
    })
  }

  down () {
    this.table('community_visitors', (table) => {
      // reverse alternations
    })
  }
}

module.exports = CommunityVisitorSchema
