'use strict'

const Blog = use('App/Models/Admin/BlogModule/Blog')


const Env = use('Env')
class BlogController {

    async index({ request, response }) {

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderPos = request.input('orderPos')

        const blogQuery = Blog.query()
        blogQuery.select('blogs.blog_topic_id', 'blogs.name', 'blogs.image', 'blogs.banner', 'blogs.slug', 'blogs.status', 'blogs.created_at', 'blogs.details');
        blogQuery.select('categories.name as blog_topic_name');
        blogQuery.leftJoin('categories', 'categories.id', 'blogs.blog_topic_id')
        blogQuery.where('blogs.status', 1)
        blogQuery.with('blog_topic');

        if (request.input("blog_topic_id") && request.input("blog_topic_id") > 0) {
            blogQuery.where('blog_topic_id', request.input("blog_topic_id"))
        }
        if (orderBy && orderPos) {
            blogQuery.orderBy(orderBy, orderPos)
        }
        if (search) {
            blogQuery.orWhereRaw(`${filed} LIKE '%${search}%'`)
        }

        const result = await blogQuery.fetch()
        return response.status(200).send(result)

    }

    async show({ params, response }) {
        
        const blogquery = Blog.query();
        blogquery.where('id', params.id);
        blogquery.with('blog_topic');
        const result = await blogquery.fetch();

        if (result.size() > 0) {
            return response.status(200).send(result)
        } else {
            return response.status(200).send({"message": "No Blog Found"})
        }
    }


    async showBySlug({ params, request, response, view }) {
    
        
        const blogquery = Blog.query();
        blogquery.where('slug', params.id);
        blogquery.with('blog_topic');
        const result = await blogquery.fetch();
        
        if (result.size() > 0) {
            return response.status(200).send(result)
        } else {
            return response.status(200).send({"message": "No Blog Found"})
        }
    }

}

module.exports = BlogController
