'use strict'

const Query = use("Query");
const Database = use("Database");

const Document = use("App/Models/Admin/DocumentModule/Document");
const ResearchTag = use("App/Models/Admin/DocumentModule/ResearchTag");
const ResearchTopic = use("App/Models/Admin/DocumentModule/ResearchTopic");
const Category = use("App/Models/Admin/ProductModule/Category");
const DocumentType = use("App/Models/Admin/DocumentModule/DocumentType");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with marketresearches
 */
class MarketResearchController {
  /**
   * Show a list of all marketresearches.
   * GET marketresearches
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {

    const query = Document.query();
    const tags = request.input("tags");
    const topic = request.input("topic");
    const category = request.input("category");
    const document_type = request.input("document_type");
    const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select('id', 'document_type_id', 'category_id', 'research_topic_id', 'name', 'seo_url_slug', 'image', 'details', 'created_at');
    
    query.with('category', (builder) => {
      builder.select('id', 'name')
    });
    query.where('status', 1);

    if (search) {
      query.where(searchQuery.search(['name']));
    }

    if (document_type) {
      query.where('document_type_id', document_type);
    }

    if (category) {
      query.where('category_id', category);
    }

    if (topic) {
      query.where('research_topic_id', topic);
    }

    if (tags) {
      query.whereHas('documentTags', (builder) => {
        builder.where('research_tag_id', tags)
      })
    }

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    let page = null;
		let pageSize = null;

		if (request.input("page")) {
			page = request.input("page");
		}
		if (request.input("pageSize")) {
			pageSize = request.input("pageSize");
		}
		var result;
		if (page && pageSize) {
			result = (await query.paginate(page, pageSize)).toJSON();
		} else if (!page && pageSize) {
			result = (await query.limit(pageSize).fetch()).toJSON();
		} else {
			result = (await query.fetch()).toJSON();
		}

		return response.status(200).send(result);
  }

  /**
   * Render a form to be used for creating a new marketresearch.
   * GET marketresearches/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new marketresearch.
   * POST marketresearches
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single marketresearch.
   * GET marketresearches/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {

    const query = Document.query();
		query.select("id", "document_type_id", "category_id", "research_topic_id", "name", "seo_url_slug", 'image', "details", "description", "url", "extension", "created_at");
		query.with('category', (builder) => {
      builder.select('id', 'name')
    });
    query.where("id", params.id);
		const result = await query.firstOrFail();

    if(result) 
    {
      const relatedQuery = Document.query();
      relatedQuery.select("id", "category_id", "name", "seo_url_slug", 'image', "details", "created_at")
      relatedQuery.with('category', (builder) => {
        builder.select('id', 'name')
      });
      relatedQuery.whereNot('id', params.id);
      relatedQuery.where('category_id', result.category_id);
      const relatedResult = (await relatedQuery.limit(3).fetch()).toJSON();

      result.related_research = relatedResult;
    }

		return response.status(200).send(result);	
  }

  async showBySlug ({ params, request, response, view }) {

    const query = Document.query();
		query.select("id", "document_type_id", "category_id", "research_topic_id", "name", "seo_url_slug", 'image', "details", "description", "url", "extension", "created_at");
		query.with('category', (builder) => {
      builder.select('id', 'name')
    });
    query.where("seo_url_slug", params.slug);
		const result = await query.firstOrFail();

    if(result) 
    {
      const relatedQuery = Document.query();
      relatedQuery.select("id", "category_id", "name", "seo_url_slug", 'image', "details", "created_at")
      relatedQuery.with('category', (builder) => {
        builder.select('id', 'name')
      });
      relatedQuery.whereNot('id', result.id);
      relatedQuery.where('category_id', result.category_id);
      const relatedResult = (await relatedQuery.limit(3).fetch()).toJSON();

      result.related_research = relatedResult;
    }

		return response.status(200).send(result);	
  }

  /**
   * Render a form to update an existing marketresearch.
   * GET marketresearches/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update marketresearch details.
   * PUT or PATCH marketresearches/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a marketresearch with id.
   * DELETE marketresearches/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }

  async reseachTopics ({ params, request, response }) {

    const query = ResearchTopic.query();
    query.select("id", "title");
    const result = (await query.fetch()).toJSON();

    return response.status(200).send(result);
  }

  async reseachTags ({ params, request, response }) {

    const query = ResearchTag.query();
    query.select("id", "name");
    const result = (await query.fetch()).toJSON();
    return response.status(200).send(result);
  }

  async reseachDocumentTypes ({ params, request, response }) {

    const query = DocumentType.query();
    query.select('id', 'name')
    const result = (await query.fetch()).toJSON();
    return response.status(200).send(result);
  }

  async reseachCategories ({ params, request, response }) {

    const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");

    const query = Category.query();

    query.withCount('documents_data as total_research')

   if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

		let pageSize = null;

		if (request.input("pageSize")) {
			pageSize = request.input("pageSize");
		}

		var result;
		if (pageSize) {
			result = (await query.limit(pageSize).fetch()).toJSON();
		} else {
			result = (await query.fetch()).toJSON();
		}

    return response.status(200).send(result);
  }
}

module.exports = MarketResearchController
