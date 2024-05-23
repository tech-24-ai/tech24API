'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldCommunityPostSchema extends Schema {
  up () {
    this.table('community_posts', (table) => {
      // alter table
	  table.integer("moderator_id").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade").after('views_counter');
	  table.datetime("moderated_at").nullable().after('moderator_id');
    })
	
	this.table('community_post_replies', (table) => {
      // alter table
	  table.integer("moderator_id").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade").after('is_correct_answer');
	  table.datetime("moderated_at").nullable().after('moderator_id');
    })
  }

  down () {
    this.table('community_posts', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldCommunityPostSchema
