'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityVisitorActivitySchema extends Schema {
  up () {
    this.create('community_visitor_activities', (table) => {
      table.increments()
	  table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
	  table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("cascade").onUpdate("cascade");
	  table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade");
	  table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("cascade").onUpdate("cascade");
	  table.boolean("activity_type").nullable().comment('1 - Create question, 2 - post answer, 3 - comment on answer, 4 - Upvote answer, 5 - Downvote answer, 6 - view question');
      table.timestamps()
    })
  }

  down () {
    this.drop('community_visitor_acitivities')
  }
}

module.exports = CommunityVisitorActivitySchema
