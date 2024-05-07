'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityVisitorViewLogSchema extends Schema {
  up () {
    this.create('community_visitor_view_logs', (table) => {
      table.increments()
	  table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("cascade").onUpdate("cascade")
	  table.integer("reference_id").unsigned()
	  table.boolean("type").comment("1 - Community post");
      table.string("ip_address")
	  table.timestamps()
    })
  }

  down () {
    this.drop('community_visitor_view_logs')
  }
}

module.exports = CommunityVisitorViewLogSchema
