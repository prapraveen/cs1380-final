# distribution

This is the distribution library. 

## Environment Setup

We recommend using the prepared [container image](https://github.com/brown-cs1380/container).

## Installation

After you have setup your environment, you can start using the distribution library.
When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To try out the distribution library inside an interactive Node.js session, run:

```sh
$ node
```

Then, load the distribution library:

```js
> let distribution = require("@brown-ds/distribution")();
> distribution.node.start(console.log);
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
> s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
> n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
> distribution.local.status.get('sid', console.log); // null 8cf1b (null here is the error value; meaning there is no error)
```

You can also store and retrieve values from the local memory:

```js
> distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // null {name: 'nikos'} (again, null is the error value) 
> distribution.local.mem.get('key', console.log); // null {name: 'nikos'}

> distribution.local.mem.get('wrong-key', console.log); // Error('Key not found') undefined
```

You can also spawn a new node:

```js
> node = { ip: '127.0.0.1', port: 8080 };
> distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
> distribution.all.status.get('sid', console.log); // {} { '8cf1b': '8cf1b', '8cf1c': '8cf1c' } (now, errors are per-node and form an object)
```

You can also send messages to other nodes:

```js
> distribution.local.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // null 8cf1c
```

Most methods in the distribution library are asynchronous and take a callback as their last argument.
This callback is invoked when the method completes, with the first argument being an error (if any) and the second argument being the result.
The following runs the sequence of commands described above inside a script (note the nested callbacks):

```js
let distribution = require("@brown-ds/distribution")();
// Now we're only doing a few of the things we did above
const out = (cb) => {
  distribution.local.status.stop(cb); // Shut down the local node
};
distribution.node.start(() => {
  // This will run only after the node has started
  const node = {ip: '127.0.0.1', port: 8765};
  distribution.local.status.spawn(node, (e, v) => {
    if (e) {
      return out(console.log);
    }
    // This will run only after the new node has been spawned
    distribution.all.status.get('sid', (e, v) => {
      // This will run only after we communicated with all nodes and got their sids
      console.log(v); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
      // Shut down the remote node
      distribution.local.comm.send([], {service: 'status', method: 'stop', node: node}, () => {
        // Finally, stop the local node
        out(console.log); // null, {ip: '127.0.0.1', port: 1380}
      });
    });
  });
});
```

# Results and Reflections

# M0: Setup & Centralized Computing

> Add your contact information below and in `package.json`.

* name: `Praveen Prabaharan`

* email: `praveen_prabaharan@brown.edu`

* cslogin: `pprabaha`


## Summary

I implemented 5 Javascript components (getText.js, getURLs.js, merge.js, stem.js, query.js) and 1 Bash component (process.sh) to complete the web crawling pipeline. I did not find any one of the components conceptually hard, but rather the most challenging aspects were getting used to writing Javascript and Bash as those are not things that I am very familiar. Specifically, I had to research how to use the Javascript libraries that were provided, as well as APIs for the Map object, and I had to learn about some of the common Shell commands and the syntax of Bash scripts.
Hours: 10
jsloc: 140
sloc: 100

## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation.


To characterize correctness, I developed 9 test cases (one for each component, and one for the end to end pipeline). In the getURL, getText, process, and stem tests, I used [this](https://cs.brown.edu/courses/csci1380/sandbox/1/) sandbox that was provided, and compared it against the raw HTML, text and links on the page. Because there were many terms, for invert, combine, merge, and query, I created my own input which I fed to this part of the pipeline. This allowed me to ensure better coverage, for example correct handling of merges when there are duplicate URLs, terms, and new URLs and terms. For the end to end test, I used [this](https://cs.brown.edu/courses/csci1380/sandbox/1/) small webpage.

*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.
To measure the throughput of crawl, index, and query, I created Bash scripts for each one as they have different units for measurement. For crawl, I timed how long it took to crawl [the large book corpus](https://cs.brown.edu/courses/csci1380/sandbox/3/index.html), and compared this against how many urls were fetched in total. For index, I crawled, then timed how long it took to index, and measured how many terms were indexed. For query, I crawled and indexed, then measured how long it took to search for the term "mystery".

- Local
    - Crawl: 0.935s, 92 urls = 98.396 url/sec
    - Index: 1.322s, 282968 terms = 214035.386 terms/sec
    - Query: 0.340s, 1 query = 2.941 queries/sec
- Cloud
    - Crawl: 1.989s, 92 urls = 46.254 url/sec
    - Index: 4.714s, 282968 terms = 60027.153 terms/sec
    - Query: 1.240s, 1 term = 0.806 queries/sec

To measure the throughput of the whole system, I created another script that runs the whole pipeline and reports the time. This is what I have used to calculate throughput in the throughput portion of package.json.

## Wild Guess

> How many lines of code do you think it will take to build the fully distributed, scalable version of your search engine? Add that number to the `"dloc"` portion of package.json, and justify your answer below.
> 
This milestone took around 250 lines of code, including tests. However, I would expect the milestones to become more difficult and complex, requiring more code to be written. Therefore, I will estimate 450 average lines of code for the remaining 6 milestones. This gives us 450 * 6 + 250 = 2950 lines of code.


# M1: Serialization / Deserialization


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.


My implementation comprises of two components, the serialize and deserialize functions, totaling around 150 lines of code, along with 100 lines of code from tests. One of the big challenges was figuring out how to serialize functions, and specifically deserialize them in a way that would maintain the function name. I first tried to parse the function args using string methods, before finding a way to elegantly use the function constructor. Another challenge was serializing the Error type, as it was not very clear how I should map it to JSON, and what properties of the Error object that I should include. However, I played around with the reference implementation to get a sense of what was important.

## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote five unit tests, each attempting to test a different edge case, including: empty serialized object, named vs anonymous functions, nested objects, string vs numbers (ex: a string of '5'), and using keywords in object (ex: serializing an object where one of the keys is 'type').


*Performance*: I wrote a testing script, m1-characterization.js to test throughput and latency for each of the three tasks. For each task, I came up with objects that I would serialize. Then, I would record the time to serialize these 100 times, and deserialize them 100 times. For throughput, I compared this against the number of bytes (before serialization), to measure bytes serialized/second. For the reported throughput and latency numbers in tha package.json, I averaged the throughput and latency across the three tasks.
The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.


# M2: Actors and Remote Procedure Calls (RPC)


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M2 (`hours`) and the lines of code per task.


My implementation comprises `4` software components, totaling `225` lines of code. One challenge that I had was figuring out how to dynamically store new routes that would be created by the routes.put function, and how to differentiate between these routes and the core service routes. After playing around with the example solution, I realized that differentiating would be easy as the core service routes are already a part of distribution.local, so I could maintain a seperate mapping for user defined routes. Another challenge I had was figuring out how to send and receive HTTP PUT requests. At first, the documentation was confusing to me, as I am used to writing code that sends HTTP requests in the order that the requests are resolved. However, in the node.js HTTP library, we first create a HTTP Client object with a callback that describes what to do when we get the response. After this, we send the payload. After studying the documentation, and recalling callbacks from lecture, I was able to clear this up. Lastly, I was conceptually struggling with chained calls to certain services, such as comm.send requests that call another comm.send request, or route.get("routes", ...), and I was unsure if my plans for implementing these functions would support these cases. I carefully walked through the logic for my implementation plan, and compared this with the reference solution, and was able to rectify this.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote `10` tests; these tests take `4s` to execute.


*Performance*: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`.
Throughput is measured in requests/second, latency is measured in seconds/request. For these measures, I attempted to create a script in test/test-student/m2-characterization.js, but I had trouble starting the server in that file. So, I created another test in the m2.student.test.js, ran it there, and made it fail so that I could see console output, and commented out this new failing test for the final submission.


## Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?
> 
Let's take ChatGPT as an example. Simplistically, ChatGPT gives access to a service, which takes in your question as text, and gives a response in text. It able to offer this functionality to many people around the world at the same time. However, this doesn't mean that every single person using this gets their own copy of ChatGPT. The code behind ChatGPT is very large, and also requires very powerful computers, making this very impractical. Additionally, ChatGPT needs to keep track of information across all of its users at once (i.e. the number of active users so it can issue rate limits), and this would be difficult if everyone had their own copy of ChatGPT. In reality, ChatGPT doesn't run on your computer, but on large datacenters elsewhere. So, what service does ChatGPT actually provide? It provides a service which takes in your question as text, then sends the message to one of the datacenters to perform the computation to get the text response, and sends it back to you. This way, we have an illusion of talking to ChatGPT directly. `createRPC` takes the core ChatGPT service that lives on the datacenter (that we started with), and converts it to the service that lets a customer ask the datacenter to do the computation and get a response. To do this, `createRPC` has to take the original service, and extend it with some steps before and after, such as preparing the information to be sent over the network, actually sending the message to the right place, and decoding the response.


# M3: Node Groups & Gossip Protocols


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M3 (`hours`) and the lines of code per task.


My implementation comprises `5` new software components, totaling `150` added lines (+ 100 lines of tests) of code over the previous implementation. Key challenges included:
1. I initially struggled a lot conceptually with the overall flow of how programs using our distributed library would work. I was having trouble with understanding how the distributed services worked, and how each node's views of the groups could be different. However, going through the gearup slides and using the reference implementation helped quite a bit.
2. I had a nasty bug with my node.js and local.comm.send which I misattributed to something else. This part was particularly difficult to debug, as I thought that these parts were fully working from part 2. However, I was processing the URLs in the HTTP requests incorrectly, which was causing me to incorrectly parse the GID from the URL, causing me to fail many tests. After using a lot of logging, I was able to solve this bug.
3. Another thing that I found challenging was implementing all.status.stop, as unlike the other distributed functions, this one had to somehow skip over sending a message to stop the local node. I spent a while trying to think of a clever way to implement this, however, I ended up reusing the all.comm.send logic and adding a special case for the local node.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness* -- I implemented 5 tests, and the entire testing suite takes 3.691s to run.


*Performance* -- I wrote a script in /tests/test-student/m3-characterization.js, where I spawned 25 nodes (any more overloaded the EC2 instance), and averaged the time. I used this to calculate the latency and throughput on both environments in seconds/node and nodes/second, respectively.


## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?
The reason why we need a gossip protocol instead of one node sending a message to all other nodes is because gossip scales better. Suppose that there are 100,000 nodes. If it was only one node's job to send a message to all the other nodes, then a single node would have to handle sending a message to 100,000 different nodes. This could effectively make that node lose all other service while it sends these messages, as its compute will be stalled with sending so many messages. However, with gossip protocols we have this node only send to around log(100,000) = 5 random nodes, and have these nodes keep gossiping. Overall, this balances the workload and scales much better.
> 

# M4: Distributed Storage


## Summary

> Summarize your implementation, including key challenges you encountered

In this milestone, I implemented three main components: the local and distributed mem service, the local and distributed store service, and the two hash functions, consistentHash and rendezvousHash. The mem service uses an in-memory JSON object to store key value pairs, and it is partitioned by the group that it belongs to. For example, to retrieve the value for key in the group groupA, we would take memory[groupA][key]. Store is implemented in a similar way, except it stores data in files. It is similarly partitioned by group, so using the previous example, using the store service the data would live in storage/groupA/key. The distributed versions of these services first uses the hash function to see which node should store the data, and then sends a message to the assigned node to call their local service to store it. One challenge was handling the different edge cases for how values could be passed into these functions. For example, in the put function, the configuration could be an object containing the GID and key, or it could only contain a string, or it could be null. 


Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M4 (`hours`) and the lines of code per task.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness* -- number of tests and time they take.
I wrote 5 tests, which test different properties of my implementation. One key property of the storage systems is idempotency for the put and get functions, so I test this for both mem and store services. Additionally, each node group should get its own key value store, and operations on one distributed group should not affect another, and I implemented a test for this. Lastly, a key property of the hash functions is that they are uniform, so I wrote a test for each hash function that hashes 1000000 keys, and ensures that the distribution is relatively uniform. The entire test suite takes 23.2 seconds to run.


*Performance* -- insertion and retrieval.
To test performance, I initialized the distributed library on 3 AWS EC2 instances, and wrote a nodejs script that adds these nodes to a group, times the insertion of 1000 key-value pairs, and times the retrieval of these pairs. The results are as follows:

LOCAL
- Insertion throughput: 2695 items/sec
- Insertion latency: 0.000371 sec/item
- Retrieval throughput: 3521 items/sec
- Retrieval latency: 0.000284 sec/item
  
CLOUD
- Insertion throughput: 637 items/sec
- Insertion latency: 0.00157 sec/item
- Retrieval throughput: 732 items/sec
- Retrieval latency: 0.001367 sec/item

## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

The reconf method shouldn't fetch all of the objects immediately, because this is a very expensive operation. In our case, the objects are unstructured data, meaning that they can be arbitrarily large in memory. In fact, it may not even be feasable for a single node to fetch all the objects. Additionally, if we are using good hash functions, then most objects will not need to move nodes, and we would be unnecessarily retrieving objects from nodes just to push them back to the same node it came from. On the other hand, keys are usually small identifiers, and it is not nearly as expensive to identify all of the keys. This way, we are only doing the expensive operation of retreiving and moving an object for the objects that need to be moved.



# M5: Distributed Execution Engine


## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M5 (`hours`) and the lines of code per task.


My implementation comprises `3` new software components (+ tests), totaling `400` added lines of code over the previous implementation. These components included supporting the null key argument for the store and mem services to return all available keys, adding append methods to the store and mem services, and creating the MapReduce service. My MapReduce works by performing the following steps:
- Register the mr service to give the map, shuffle, and reduce functions to other nodes
- Instruct each node to call the map service for all of their relevant keys, and store the results under a new GID
- Register a new group for each worker node
- Reshuffle the results onto this new group
- Call reduce on each worker node
- Aggregate the results
One key challenge was trying to figure out the correct way to set up each worker node so that they had all of the available information required for distributed execution. Something that I was struggling with at first was figuring out how to make the map and reduce functions completely stateless. Most of the function did not require any external context, and could just reference the node's own global state, but on the mrService the mapper and reduce functions were in the outer context and not directly accessible. To reconcile this, I accessed the mapper and reducer functions through the distribution.local.routes* methods. Another challenge I had was thinking about the communication from the orchestrator to the worker nodes, and how we would know when each step was finished. I solved this by modifying my the all.comm.send, which almost does this. Before this milestone, all.comm.send would send a request to nodes one at a time, waiting for one node to return before sending the next request. I modified this to send the requests all at once, but wait for all of the nodes to return before calling the callback. This solved my issue of needing a reliable way of knowing when a step finished. 

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote <X> cases testing <1, 2, 3>.


*Performance*: 
I tested my workflow by running a distributed grep on 5 books (if a book was >= 9999 lines, I cut it off). Overall, it took 507ms to process 38282 lines.
My distributed grep can sustain 75507 lines/second, with an average latency of 0.00001324 seconds per line.


## Key Feature

> Which extra features did you implement and how?
