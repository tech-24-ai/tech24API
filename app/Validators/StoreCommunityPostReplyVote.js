'use strict'

class StoreCommunityPostReplyVote {
	get rules() {
		const id = this.ctx.params.id
		return {
			community_post_reply_id: 'required',
			vote_type: 'required',
		}
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreCommunityPostReplyVote
