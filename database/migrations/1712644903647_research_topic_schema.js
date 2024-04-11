'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResearchTopicSchema extends Schema {
  up () {
    this.create('research_topics', (table) => {
      table.increments()
	  table.string("title").nullable();
	  table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
	  table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
      table.timestamps()
    })
	
    this.create('research_tags', (table) => {
      table.increments()
	  table.string("name").nullable();
	  table.integer("created_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
	  table.integer("updated_by").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
      table.timestamps()
    })
	
    this.create('document_tags', (table) => {
      table.increments()
	  table.integer("research_tag_id").unsigned().references("id").inTable("research_tags").onDelete("restrict").onUpdate("cascade");
	  table.integer("document_id").unsigned().references("id").inTable("documents").onDelete("cascade").onUpdate("cascade");
      table.timestamps()
    })
	
	this.table('documents', (table) => {
      // alter table
	  table.integer("category_id").unsigned().after('document_type_id').references("id").inTable("categories").onDelete("restrict").onUpdate("cascade");
	  table.integer("research_topic_id").unsigned().after('category_id').references("id").inTable("research_topics").onDelete("restrict").onUpdate("cascade");
	  table.text("details").nullable().after('seo_url_slug');
	  table.boolean("status").defaultTo(false).comment("0 - In-active, 1 - Active, 2 - Draft");
    })
  }

  down () {
    this.drop('research_topics')
    this.drop('research_tags')
    this.drop('document_tags')
  }
}

module.exports = ResearchTopicSchema
