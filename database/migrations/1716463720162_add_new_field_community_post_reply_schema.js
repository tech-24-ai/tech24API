'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldCommunityPostReplySchema extends Schema {
  up () {
    this.table('community_post_replies', (table) => {
      // alter table
	  table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("restrict").onUpdate("cascade").after("parent_id");
    })
  }

  down () {
    this.table('community_post_replies', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldCommunityPostReplySchema
