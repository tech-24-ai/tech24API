'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldBlogSchema extends Schema {
  up () {
    this.table('blogs', (table) => {
      // alter table
	  table.string("author").nullable().after('html');
	  table.string("read_time").nullable().after('author');
    })
  }

  down () {
    this.table('blogs', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldBlogSchema
