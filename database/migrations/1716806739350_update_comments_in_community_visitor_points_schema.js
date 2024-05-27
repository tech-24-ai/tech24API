'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateCommentsInCommunityVisitorPointsSchema extends Schema {
  up () {
    this.table('community_visitor_points', (table) => {
      // alter table
	  table.integer("type").comment(" 1 - answer upvotes, 2 - post answer and approved it, 3 - mark as correct answer, 4 - post question and approved it, 5 - question upvotes").alter();
    })
  }

  down () {
    this.table('community_visitor_points', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateCommentsInCommunityVisitorPointsSchema
