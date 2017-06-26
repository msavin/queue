Queue = {}

Queue.config = {}

Queue.collection = new Mongo.Collection("queue");

Queue.register = function (config) {
	keys = Object.keys(config);

	keys.forEach(function (key) {
		Queue.config[key] = config[key];
	});
}

Queue.add = function (name, data) {
	if (Queue.config[name])	{
		Queue.collection.insert({
			name: name,
			data: data,
			date: new Date()
		});
	} else {
		console.log("Queue Error: '" + name + "' does not exist");
	}
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
				return Queue.config[doc.name][action](doc.data, extraData);
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