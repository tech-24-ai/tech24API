'use strict'
const Query = use("Query");
const Database = use("Database");

const Blog = use('App/Models/Admin/BlogModule/Blog')
const CommunityVisitorLibrary = use('App/Models/Admin/CommunityModule/CommunityVisitorLibrary')


const Env = use('Env')
class BlogController {

    async index({ request, response }) {

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderPos = request.input('orderPos')
        const searchQuery = new Query(request, { order: "id" });

        const blogQuery = Blog.query()
        blogQuery.select('blogs.blog_topic_id', 'blogs.name', 'blogs.image', 'blogs.banner', 'blogs.slug', 'blogs.status', 'blogs.created_at', 'blogs.details', 'blogs.author', 'blogs.read_time');
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
            blogQuery.where(searchQuery.search(['blogs.name']));
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
			result = (await blogQuery.paginate(page, pageSize)).toJSON();
		} else if (!page && pageSize) {
			result = (await blogQuery.limit(pageSize).fetch()).toJSON();
		} else {
			result = (await blogQuery.fetch()).toJSON();
		}

        return response.status(200).send(result)
    }

    async show({ params, response, auth }) {
        
        const userId = (auth.user) ? auth.user.id : "";
        const blogquery = Blog.query();
        blogquery.where('id', params.id);
        blogquery.with('blog_topic');
        blogquery.with('is_saved_blog', (builder) => {
            builder.select('id', 'visitor_id', 'blog_id', 'created_at')
            builder.where('visitor_id', userId)
        });
        let result = await blogquery.fetch();

        if (result.size() > 0) {

            result = result.toJSON();
            const relatedQuery = Blog.query();
            relatedQuery.with('blog_topic');
            relatedQuery.whereNot('id', result[0].id);
            relatedQuery.where('blog_topic_id', result[0].blog_topic_id);
            relatedQuery.orderBy('id', 'DESC')
            const relatedResult = (await relatedQuery.limit(3).fetch()).toJSON();

            result[0].related_blogs = relatedResult;
            return response.status(200).send(result)
        } else {
            return response.status(200).send({"message": "No Blog Found"})
        }
    }


    async showBySlug({ params, request, response, view, auth }) {
    
        const userId = (auth.user) ? auth.user.id : "";
        const blogquery = Blog.query();
        blogquery.where('slug', params.id);
        blogquery.with('blog_topic');
        blogquery.with('is_saved_blog', (builder) => {
            builder.select('id', 'visitor_id', 'blog_id', 'created_at')
            builder.where('visitor_id', userId)
        });
        let result = await blogquery.fetch();
        
        if (result.size() > 0) {

            result = result.toJSON();
            const relatedQuery = Blog.query();
            relatedQuery.with('blog_topic');
            relatedQuery.whereNot('id', result[0].id);
            relatedQuery.where('blog_topic_id', result[0].blog_topic_id);
            relatedQuery.orderBy('id', 'DESC')
            const relatedResult = (await relatedQuery.limit(3).fetch()).toJSON();

            result[0].related_blogs = relatedResult;

            return response.status(200).send(result)
        } else {
            return response.status(200).send({"message": "No Blog Found"})
        }
    }

    async save_to_library({ request, response, auth }) 
    {
        const userId = auth.user.id;

        try {

            const isExist = await CommunityVisitorLibrary.findBy({
				blog_id: request.input("id"),
				visitor_id: userId,
				type: 2,
			});
      
			if (isExist) {
				return response.status(422).send([{ message: "You have already saved." }]);
			}	

            const query = new CommunityVisitorLibrary();
            query.visitor_id = userId;
            query.blog_id = request.input("id");
            query.type = 2;
            query.created_by = userId;
            query.updated_by = userId;
            await query.save();

            return response.status(200).send({ message: "Create successfully" });
        } catch (error) {
			console.log(error);
            Logger.transport("file").info(
                `save blog error : ${error}`
            );
			return response.status(423).json({ message: "Something went wrong"});
		}    
    }
}

module.exports = BlogController
