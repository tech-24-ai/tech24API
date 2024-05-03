'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldCommunityPostSchema extends Schema {
  up () {
    this.table('community_posts', (table) => {
      // alter table
	  table.text("reject_reason").nullable().after('status');
    })
  }

  down () {
    this.table('community_posts', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldCommunityPostSchema
