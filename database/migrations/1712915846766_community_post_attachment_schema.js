'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommunityPostAttachmentSchema extends Schema {
  up () {
    this.create('community_post_attachments', (table) => {
      table.increments()
	  table.integer("community_post_id").unsigned().references("id").inTable("community_posts").onDelete("cascade").onUpdate("cascade");
	  table.string("name").nullable()
	  table.text("url").nullable()
	  table.string("extension").nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('community_post_attachments')
  }
}

module.exports = CommunityPostAttachmentSchema
