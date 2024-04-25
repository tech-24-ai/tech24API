'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldCommunityVisitorPointSchema extends Schema {
  up () {
    this.table('community_visitor_points', (table) => {
      // alter table
	  table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade").after('points');
    })
  }

  down () {
    this.table('community_visitor_points', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldCommunityVisitorPointSchema
