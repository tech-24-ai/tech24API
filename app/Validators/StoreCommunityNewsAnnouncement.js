'use strict'

class StoreCommunityNewsAnnouncement {
	get rules() {
		const id = this.ctx.params.id
		if (id) {
			return {
				community_id: 'required',
				title: `required|unique:community_news_announcements,title,id,${id}`,
				description: 'required',
			}
		} else {
			return {
				community_id: 'required',
				title: 'required|unique:community_news_announcements,title',
				description: 'required',
			}
		}
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreCommunityNewsAnnouncement
