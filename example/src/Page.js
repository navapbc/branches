import React, { Suspense, lazy } from "react";

// Page content components are defined in the node's `component` property
// and rendered as <PageContent>. In order for this to work, we need to
// import all the page components. We do so lazily so that the initial
// bundle's file size is smaller
const PageContentComponents = {
  HouseholdMembers: lazy(() => import("./pages/HouseholdMembers")),
  HouseholdMemberProfile: lazy(() => import("./pages/HouseholdMemberProfile")),
  NonResidentRedirect: lazy(() => import("./pages/NonResidentRedirect")),
  StateResidency: lazy(() => import("./pages/StateResidency")),
  UserProfile: lazy(() => import("./pages/UserProfile")),
  Welcome: lazy(() => import("./pages/Welcome"))
};

class Page extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const node = this.props.position.activeNode();
    console.log("node", node);

    const PageContent = node.component ? PageContentComponents[node.component] : null;

    return (
      <main>
        {node.content && <h1>{node.content.title}</h1>}

        <Suspense fallback={<p>Loading next page&hellip;</p>}>
          <PageContent {...this.props} />
        </Suspense>

        <p>
          <button onClick={this.props.next}>
            <strong>Next</strong>
          </button>
        </p>
        <p>
          <button onClick={this.props.reset}>Restart</button>
        </p>
      </main>
    );
  }
}

export default Page;
