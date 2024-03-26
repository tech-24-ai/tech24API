'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BookmarkSchema extends Schema {
  up () {
    this.create('bookmarks', (table) => {
      table.increments()
      table.timestamps()
      table.string('type')
      table.string('value',65535)
      table.integer('user_id')
      table.string('name')
    })
  }

  down () {
    this.drop('bookmarks')
  }
}

module.exports = BookmarkSchema
