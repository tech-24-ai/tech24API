'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BadgeSchema extends Schema {
	up () {
		this.create('badges', (table) => {
			table.increments()
			table.string("title").nullable()
			table.integer("min_range")
			table.integer("max_range")
			table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade")
			table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade")
			table.timestamps()
		})
		
		this.create('community_visitor_points', (table) => {
			table.increments()
			table.integer("visitor_id").unsigned().references("id").inTable("visitors").onDelete("restrict").onUpdate("cascade")
			table.integer("type").comment('1 - upvotes, 2 - answer, 3 - accept answer, 4 - post question')
			table.integer("points")
			table.integer("community_post_reply_id").unsigned().references("id").inTable("community_post_replies").onDelete("cascade").onUpdate("cascade")
			table.timestamps()
		})
	}

	down () {
		this.drop('badges')
		this.drop('community_visitor_points')
	}
}

module.exports = BadgeSchema
