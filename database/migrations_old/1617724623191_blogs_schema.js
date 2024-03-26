'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BlogsSchema extends Schema {
  up () {
    this.create('blog_topics', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.timestamps()
    })

    this.create('blogs', (table) => {
      table.increments()
      table.integer('blog_topic_id').unsigned().references('id').inTable('blog_topics').onDelete('restrict').onUpdate('cascade')
      table.string('meta_title', 100).nullable()
      table.string('meta_description', 150).nullable()
      table.string('meta_keywords', 200).nullable()
      table.string('name', 100).notNullable()
      table.text('image').nullable()
      table.text('banner').nullable()
      table.string('slug', 150)
      table.text('details').nullable()
      table.text('html').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('blog_topics')
    this.drop('blogs')
  }
}

module.exports = BlogsSchema
