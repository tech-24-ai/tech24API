'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SearchReportSchema extends Schema {
  up() {
    this.create('search_reports', (table) => {
      table.increments()
      table.integer('country_id').nullable()
      table.integer('industry_id').nullable()
      table.integer('org_size').nullable()
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('cascade').onUpdate('cascade')
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
      table.integer('visitor_id').unsigned().references('id').inTable('visitors').onDelete('cascade').onUpdate('cascade')
      table.boolean('is_advanced')
      table.timestamps()
    })

    this.create('search_report_questions', (table) => {
      table.increments()
      table.integer('search_report_id').unsigned().references('id').inTable('search_reports').onDelete('cascade').onUpdate('cascade')
      table.integer('question_id').unsigned().references('id').inTable('questions').onDelete('cascade').onUpdate('cascade')
    })

    this.create('search_report_options', (table) => {
      table.increments()
      table.integer('search_report_question_id').unsigned().references('id').inTable('search_report_questions').onDelete('cascade').onUpdate('cascade')
      table.integer('option_id').unsigned().references('id').inTable('options').onDelete('cascade').onUpdate('cascade')
    })

    this.create('search_report_sub_options', (table) => {
      table.integer('search_report_option_id').unsigned().references('id').inTable('search_report_options').onDelete('cascade').onUpdate('cascade')
      table.integer('sub_option_id').unsigned().references('id').inTable('sub_options').onDelete('cascade').onUpdate('cascade')
    })

    this.create('search_report_products', (table) => {
      table.integer('search_report_id').unsigned().references('id').inTable('search_reports').onDelete('cascade').onUpdate('cascade')
      table.text('name')
      table.string('vendor', 120)
      table.string('category', 120)
      table.string('module', 120)
      table.string('rating', 100)
      table.string('price', 100)
      table.text('notes')
      table.text('link')
      table.timestamps()
    })
  }

  down() {
    this.drop('search_reports')
    this.drop('search_report_options')
    this.drop('search_report_products')
    this.drop('search_report_sub_options')
  }
}

module.exports = SearchReportSchema
