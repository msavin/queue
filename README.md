# Queue - a Moderation System Boilerplate for Meteor 

> Note: this package is not complete yet. I'm going to focus on getting the right feature set, then build the package. Feel free to open an issue or comment on the [forum thread](https://forums.meteor.com/t/queue-package-for-meteor-for-things-like-activity-moderation/37515/11) - your feedback will be super helpful to making sure this is done right!
  
There are many moments when our application needs a moderation system to resolve complains or authorize certain tasks. 

For example, let's say we have an apartment listing website. We need to be able to receive reports of bad listings, and make the decision to pull them down or ignore the request. Or, we might want to have a process to approve or reject them before they can be seen publicly.

Queue aims to help here by providing a boilerplate for managing these interactions. You start by creating a queue, and then defining what possible inputs and outputs it may have. Then, you can add items to it and resolve them as you wish. 

# Step 1: Creating the Queues

To mirror our example above, lets say we want to create two queues: one to  ensure that we have to approve every listing that goes on the website, and another to allow us to handle complaints. First, we need to register the queues and define the possible tasks.

```javascript
Queue.register({
    reportListingProblem: {
        remove: {
            report: function (data) {
                Apartments.remove(data.identifier)
            },
            reporter: function (data, reporter) {
                MagicEmail.send({
                    userId: reporter.id,
                    subject: "Thank you - your report has been addressed."
                    message: data.message
                })
            }
        }, 
        ignore: {
            reporter: function (data, reporter) {
                MagicEmail.send({
                    userId: reporter.id,
                    subject: "Thank you - your report has been declined."
                    message: data.message
                })
            }
        }
    }
})
```

This will make more sense after reading the rest of the article, but the idea is, Queue groups reported items to one document to prevent flooding and having to repeat actions. 

Therefore, you have two functions, one to deal with the report, and the other to provide some kind of feedback to the people who reported it. Both are optional. 

As for our MagicEmail function, its just to keep things simple - but you can think of it as something that will take the userId that Queue provides, finds the email addres sfor it, and sends it out along with a dynamic message. 

# Step 2: Adding Items and Resolving Them

When we add items to our queue, there are a four kinds of data that we want to record.

  1. Meta Data. Who is making these reports, at what time, and so on. Queue will track these things automatically when Meteor.user() is available. If it isn't, you can specify it yourself. 

  2. Priority Data. While we may prefer to track these items in chronological order, we may need to mark some items are higher priority than others. By default, every item will have a priority of 0, and you can add any number you wish

  3. Identifier Data. When adding items to the Queue, we want to look if there is some commonality between them. For example, if the same apartment listing is reported 100 times, we might prefer to group these items into one report.

  4. Supplementary Data. Each report might have a comment by a member or some other kind of indication. It's important that we can save and see all of them.


```javascript
Meteor.call({
    listingReport: function (complaint) {
        var complaintId = Queue.add(
            name: 'requestPostApproval',
            identifier: complaint.apartmentId,
            userId: Meteor.userId(),    // optional & automatic
            priority: 1,                // optional
            data: {
                reason: complaint.apartmentId,
            }
        });

        return complaintId;
    }
})
```

In this example, we are adding an item to the Queue and identifying it with the _id of the listing. If other people complain about this listing, it will be grouped as one.

We also pass in the userId of the person who filed the complaint through Meteor.userId(). This field is optional, because in this case, Queue would check for the variable and find it with-in the scope of the Method.

# Step 3: Viewing the Issues

To view problems, we have handy functions to help us see complaints. By default, we will get items sorted first by priority, then by how many times its been reported, then by oldest to latest.

```
Queue.get("reportListing", 10)      // returns the top 10 items
```

This would let us interact with data easily through shell. Alternatively, if we want to build it into our admin panel, we can access the collections directly though `Queue.collection`.

# Step 3: Solving Problems 

Next, let's say that someone trolled our website, and now we have five alerts about it thanks to our amazing members.

We want to issue 

```javascript
Meteor.methods({
    listingResolve: function (resolve) {
        if (!magicPermissionCheck())
            return;
            
        Queue.resolve({
            name: "requestPostApproval"
            identifier: resolve.apartmentId,
            resolverUserId: Meteor.userId,
            data: {
                publicMessage: resolve.public,
                privateMessage: resolve.private
            }
        })
    }
})

// ...

Meteor.call("resolveComplaint", {
    name: "requestPostApproval",
    apartmentId: "Cb3rLq6FNZu7QtqKE",
    privateMessage: "Your listing has been removed from our website for not following the community guidelines.",
    publicMessage: "Thank you for reporting this problem so quickly!  - you're all set, thanks for using our app!"
})
```

Then, the Queue would do its job. In our case, it would update the document of the apartment listing to be no longer visible, email the author about the decision, and email everyone else an update. 
