'use strict'

class StoreCommunityPostReply {
	get rules() {
		const id = this.ctx.params.id
		return {
			community_post_id: 'required',
			description: 'required',
		}
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreCommunityPostReply
