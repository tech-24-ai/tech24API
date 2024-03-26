'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldInCommunityPostReplySchema extends Schema {
	up () {
		this.table('community_post_replies', (table) => {
			table.boolean("is_correct_answer").defaultTo(false).after('status').comment("0 - no, 1 - yes");
		});
		
		this.table('communities', (table) => {
			table.dropColumn("views_counter");
		});
		
		this.table('community_posts', (table) => {
			table.integer("views_counter").defaultTo(0).after('status');
		});
		
		this.table('community_post_replies', (table) => {
			table.dropForeign('community_post_id');
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade").alter();
		})
		
		this.table('community_post_tags', (table) => {
			table.dropForeign('community_post_id');
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade").alter();
		})
		
		this.table('report_abuses', (table) => {
			table.dropForeign('community_post_reply_id');
			table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("cascade").onUpdate("cascade").alter();
		})
		
		this.table('votes', (table) => {
			table.dropForeign('community_post_id');
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade").alter();
			table.dropForeign('community_post_reply_id');
			table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("cascade").onUpdate("cascade").alter();
		})
		
	}

	down () {
		
	}
}

module.exports = AddNewFieldInCommunityPostReplySchema
