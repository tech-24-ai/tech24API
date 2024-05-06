'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateDatatypeCommunityPostSchema extends Schema {
  up () {
    this.table('community_posts', (table) => {
      // alter table
	  table.longtext('description').nullable().alter();
    })
	
    this.table('community_post_replies', (table) => {
      // alter table
	  table.longtext('description').nullable().alter();
    })
  }

  down () {
    this.table('community_posts', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateDatatypeCommunityPostSchema
