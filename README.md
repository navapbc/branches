<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Branches](#branches)
  - [Example app](#example-app)
  - [Tests](#tests)
  - [Usage](#usage)
    - [What `Navigator` does](#what-navigator-does)
    - [What your app does](#what-your-app-does)
    - [Graph layout](#graph-layout)
      - [Nodes and their control properties](#nodes-and-their-control-properties)
      - [Sections](#sections)
      - [SectionOrdering](#sectionordering)
    - [Deciding which node to visit next](#deciding-which-node-to-visit-next)
      - [Condition on a node](#condition-on-a-node)
      - [Condition on the next control property](#condition-on-the-next-control-property)
    - [Associating application data with a node](#associating-application-data-with-a-node)
      - [Referencing a collection](#referencing-a-collection)
      - [Looping over entries in a collection](#looping-over-entries-in-a-collection)
  - [What next](#what-next)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Branches

A graph structure with navigation and analysis functions to aid in building branching user interfaces.

## Example app

An example application is located in [`example/`](example/).

**Run the example app:**

1. Clone this repo
1. Navigate to the [`example`](example) directory in your terminal
1. Install the example app's dependencies:
  ```sh
  npm install
  ```
1. Run the app
  ```sh
  npm start
  ```

Once the `start` command is ran, a development server will start and should automatically navigate to [localhost:3000](http://localhost:3000/) in your browser.

You can edit the files in the `example` directory—including [graph.json](example/react/graph.json)—and see live updates in your browser.

## Tests

Before you run the tests for the first time, you need to install the project's development dependencies. This adds the test framework and libraries that let it parse the latest javascript syntax. You can add them using npm at the root level of this repository:
`npm install`

Unit tests can be run using npm:
`npm test`

## Usage

To use a flow control graph in your own project, you will first need to import this library and then create a new instance of a `Navigator` with your own graph data. We will talk about the `sections` and `sectionOrdering` passed to the `Navigator` later; the other parameters are detailed in the [`Navigator` source file](src/Navigator.js).

```js
import Navigator from "branches";
const navigator = new Navigator({ sections, sectionOrdering });
```

> 🚨 For now, you'll need to include the `branches` source files in your project manually. I hope to publish the code to npm soon to make it even easier to install.

### What `Navigator` does

The `Navigator` object provides methods for navigating sequentially through the user flow. It looks at the control properties of each graph node to determine a path through the user flow. In your application, you will mostly use the `initialPosition` and `nextPosition` functions to navigate the graph.

```js
const initialPosition = navigator.initialPosition(applicationData);
const nextPosition = navigator.nextPosition(applicationData, initialPosition);
```

`Position` objects are returned from the Graph's \*Position methods. Each position refers to a specific point in the application and lets you get back information about it.

The `GraphAnalyzer` provides methods for testing the shape of your graph to ensure users won't get stuck on a bad path or be unable to reach certain nodes.

### What your app does

On each graph node, you can store your own data. Use that data to decide what to show your user. You can think of each node as a page of your application, and the properties you add to that node as props you pass into the render function for that page.

```js
function renderPage(props) {
  const { title } = props;
  return `<h1>${title}</h1>`;
}
```

```js
const node = nextPosition.activeNode();
renderPage(node.userData);
```

### Graph layout

The flow control graph represents the user flow through a branching series of user interface elements. Each node of the graph represents a page the user may visit. Root nodes are called sections, which group related pages and allow for consistent entry points throughout the user flow.

#### Nodes and their control properties

Each piece of the graph is a node. All information used by the flow control graph lives inside the nodes' `_control` properties. We call these control properties. You can use a different key to store the control properties by passing a `controlKey` parameter when constructing your Graph.

A simple node looks like the following:

```js
{
  _control: {
    next: "anotherNode"
  },
  data: {
    // anything can go here, really
  }
}
```

The `next` control property tells the Graph which sibling node should come after the current node. Any other property of the node is simply a place for you to store data relevant to your application.

Nesting all your user data within a single top-level property like `data` can make it easier to use with the GraphAnalyzer; you can configure it to ignore a single key and avoid false-positives for unreachable nodes.

For a complete example of the possible control properties and how they fit in a graph, see the mock data in the [Graph test file](src/Graph.test.js).

#### Sections

Each section is the root node of a graph structure. It specifies the `initialNode` to provide an entry point into its child nodes.

```js
const first = {
  _control: { initialNode: "a" },
  a: { _control: { next: "b" } },
  b: { _control: { next: "c" } },
  c: {},
};
…
const sections = { first, second, third };
```

#### SectionOrdering

The section ordering array tells the `Graph` the order in which to visit each section. The sections are identified by their key, and visited sequentially as the path through each is completed.

```js
const sectionOrdering = ["first", "second", "third"];
```

### Deciding which node to visit next

#### Condition on a node

The `condition` control property lets you determine whether a given node should be visited. If the named condition function returns false, the node will be skipped,and progress will continue with the next node.

```js
_control: {
  condition: "isRaining",
  next: "following"
}
```

Condition functions are provided to the graph as a map called filters. When evaluated as part of a control property, the condition functions receive the _incoming_ position as a parameter.

```js
const filters = {
  isRaining: (data, position) => false,
  isCloudy: (data, position) => true,
  isSunny: (data, position) => false
}
new Graph({ sections, sectionOrdering, filters });
```

Stored in the `filters` property of the Graph.
`condition(userData, enteringNode)`

#### Condition on the next control property

The `next` control property can take a few forms. The simplest is the string key of the following sibling node. To enable a choice between following nodes, you can also provide an array of `{ key, condition }` pairs.

```js
next: [
  { key: "indoorActivities", condition: "isRaining" },
  { key: "walk", condition: "isCloudy" },
  { key: "picnic", condition: "isSunny" },
  "lounge"
]
```

The `key` property is just like the string form of `next`; it is the string key of a sibling node. The `condition` property is the string key of a filter function provided to the Graph.

The condition functions for the `next.condition` control property are the same as those of the entry condition property. When evaluated for a `next` condition, the functions receive the _departing_ position as a parameter.

### Associating application data with a node

#### Referencing a collection

You can reference application data within a `Position`. To do so, you can specify a `collectionPath` control property. The Graph will then collect the keys for all objects stored at that path within your application data. The keys are retrievable from the `Position` object, and can be used to look up the relevant data when you visit that position. We store keys and paths rather than data so the positions work well with copy-on-write data types like those from Immutable.js or produced with Immer.

You can select a subset of a collection by using the `collectionFilter` control property. Filters are called with the application data and each collection entry.

#### Looping over entries in a collection

Specify an `initialNode` in addition to a `collectionPath` and the entries in that collection will be iterated over on each visit to the initial node.

Any collection that has zero entries will be skipped, and progress will continue with the next node.

## What next

- Try changing parameters within the example graph.
- Look at the Graph.test.js mock data structure for reference controls
