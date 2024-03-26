'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunitySchema extends Schema {
	up () {
		this.create('communities', (table) => {
			table.increments();
			table.string("name").nullable();
			table.text("description").nullable();
			table.text("url_slug").nullable();
			table.integer("views_counter");
			table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('tags', (table) => {
			table.increments();
			table.string("name");
			table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('community_posts', (table) => {
			table.increments();
			table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("restrict").onUpdate("cascade");
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.string("title");
			table.text("url_slug");
			table.text("description");
			table.boolean("is_discussion_open").defaultTo(true);
			table.boolean("status").defaultTo(false).comment("0 - pending, 1 - accept, 2 - reject");
			table.timestamps();
		});
		
		this.create('community_post_tags', (table) => {
			table.increments();
			table.integer("tag_id").unsigned().references("id").inTable("tags").onDelete("restrict").onUpdate("cascade");
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('community_post_replies', (table) => {
			table.increments();
			table.integer("parent_id");
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("restrict").onUpdate("cascade");
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.text("description");
			table.boolean("status").defaultTo(false).comment("0 - pending, 1 - accept, 2 - reject");
			table.timestamps();
		});
		
		this.create('votes', (table) => {
			table.increments();
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("restrict").onUpdate("cascade");
			table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("restrict").onUpdate("cascade");
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.boolean("vote_type").comment("0 - dislike, 1 - like");
			table.timestamps();
		});
		
		this.create('community_visitors', (table) => {
			table.increments();
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('report_abuse_types', (table) => {
			table.increments();
			table.string("name");
			table.boolean("status").defaultTo(true).comment(" 1 - Active, 0 - In-active ");
			table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
			table.timestamps();
		});
		
		this.create('report_abuses', (table) => {
			table.increments();
			table.integer("report_abuse_type_id").unsigned().references("id").inTable("report_abuse_types").onDelete("restrict").onUpdate("cascade");
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade");
			table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("restrict").onUpdate("cascade");
			table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("restrict").onUpdate("cascade");
			table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("restrict").onUpdate("cascade");
			table.text("reason");
			table.timestamps();
		});
	}

	down () {
		this.drop('communities');
		this.drop('tags');
		this.drop('community_posts');
		this.drop('community_post_tags');
		this.drop('community_post_replies');
		this.drop('votes');
		this.drop('community_visitors');
		this.drop('report_abuse_types');
		this.drop('report_abuses');
	}
}

module.exports = CommunitySchema
