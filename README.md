# Queue for Meteor 

When you create an application, there are many times that you need to create a moderation system to approve certain requests, resolve complaints, and so on.

For example, let's say we have an apartment listing website. We need to be able to receive reports of bad listings, and make the decision to pull them down or ignore the request. Alternatively, we might want to have a process to approve or reject them before publishing them to the website.

Queue can help you here with a simple server-side interface for creating various queues, adding items to them, and providing possible responses. How you expose that functionality to the rest of the applications would be completely up to you.

# Example Usage

To mirror our example above, lets say we want to create two queues: one to  ensure that we have to approve every listing that goes on the website, and another to allow us to handle complaints. First, we need to define them and their possible tasks

```javascript
Queue.register({
    reportListingProblem: {
        ignore: function (queueData, addedData) {
            // Rejected the document
            Listings.update(queueData._id, {
                $set: {
                    approved: -1
                }
            })

            // Send an email to notify the person
            MagicEmail.send({
                // ...
                message: addedData.message
            })
        }, 
        remove: function (queueData, addedData) {
            // Mark the document as approved
            Listings.update(queueData._id, {
                $set: {
                    approved: 1
                }
            })

            // Send an email to notify the person
            MagicEmail.send({
                // ...
                message: addedData.message
            })
        }
    }
})
```

Next, we need a function to add items to the queue. The function could run inside of a Method as the end developer would see fit.

```javascript
Queue.add('requestPostApproval', {
    data: {
        userId: Meteor.userId(),
        listingId: listingId
    }
});
```

Finally, we would then have functions to let us access the items in these queues, and resolve them, such as:

```javascript
Meteor.methods({
    resolveComplaint: function (itemId, personalMessage) {
        check([itemId, personalMessage], String);

        if (magicPermissionCheck()) {
            Queue.resolve(itemId, "approve", {
                message: personalMessage,
                resolvedBy: Meteor.user().name,
                resolvedId: Meteor.user()._id,
                resolvedAt: new Date()
            }) 
        }
    }
})

// ...

Meteor.call("resolveComplaint", "Cb3rLq6FNZu7QtqKE", "John - you're all set, thanks for using our app!", callback);
```

Then, the Queue would do its job. In our case, it would update a document and send an email indicating that that the operation was complete. 
