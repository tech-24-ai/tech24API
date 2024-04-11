'use strict'

class StoreResearchTopic {
	get rules() {
		const id = this.ctx.params.id
		if (id) {
			return {
				title: `required|unique:research_topics,title,id,${id}`,
			}
		} else {
			return {
				title: 'required|unique:research_topics,title',
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

module.exports = StoreResearchTopic
