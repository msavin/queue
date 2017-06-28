Queue = {}

Queue.config = {}
Queue.pending = new Mongo.Collection("queuePending");
Queue.posted = new Mongo.Collection("queuePosted");

Queue.register = function (config) {
	keys = Object.keys(config);

	keys.forEach(function (key) {
		Queue.config[key] = config[key];
	});
}

Queue.add = function (name, data) {
	if (Queue.config[name])	{
		doc = {
			name: name,
			data: data,
			date: new Date()
		}

		if (Meteor.userId()) {
			doc.userId = Meteor.userId();
		}

		Queue.collection.insert(doc);
	} else {
		console.log("Queue Error: '" + name + "' does not exist");
	}
}

Queue.addToHistory = function (doc, action, extraData, result) {
	doc = {
		original: doc,
		action: action,
		extraData: extraData,
		result: result
	};

	if (Meteor.userId) {
		userId: Meteor.userId();
	}

	Queue.posted.insert(doc)
}

Queue.resolve = function (id, action, extraData) {
	// First, we get the document of the item in the queue
	doc = Queue.collection.findOne(id)

	if (doc) {
		// Then, we want to remove the document to minimize the risk of it being called twice
		remove = Queue.collection.remove(id);

		// Assume the remove returns 1, we can assume we are the only ones to touch it
		if (remove === 1) {
			try  {
				result = Queue.config[doc.name][action](doc.data, extraData);
				// assuming the function above ran successfully, we add the item to history
				if (result) {
					Queue.addToHistory(doc, action, extraData, result)
				}
				return result;
			} catch (e) {
				// If the function failed for whatever reason, we put the item back in the queue
				Queue.collection.insert(doc);
			}
		}
	} else {
		console.log("Queue Error: item '" + id + "' was not found.");
		return false;
	}
}

Queue.resolveAll = function (id, action, extraData) {
	doc = Queue.collection.findOne(id)
	doc.data;

	docs.find({data: docData}).fetch().forEach(function (item) {
		Queue.resolve(item._id, action, extraData)
	});
}
