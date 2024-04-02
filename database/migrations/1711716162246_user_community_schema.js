'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserCommunitySchema extends Schema {
  up () {
    this.create('user_communities', (table) => {
      table.increments()
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade").onUpdate("cascade");
      table.integer("community_id").unsigned().references("id").inTable("communities").onDelete("cascade").onUpdate("cascade");
      table.timestamps()
    })

  }

  down () {
    this.drop('user_communities')
  }
}

module.exports = UserCommunitySchema
