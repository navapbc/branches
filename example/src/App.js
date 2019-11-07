import Page from "./Page";
import React from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import Navigator from "branches";
import graph from "./graph";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.navigator = new Navigator({
      sections: graph.sections,
      sectionOrdering: graph.sectionOrdering,
      filters: graph.filters
    });

    // The root of all of our graph pages' URLs
    this.root_path = "/app/";

    // Store our Single Page App's form data
    this.state = {
      application: {
        householdMembers: {
          a: {
            id: "a"
          },
          b: {
            id: "b"
          }
        }
      }
    };
  }

  /**
   * onChange event handler for all of our form fields.
   * Updates the field's application state entry
   * @param {Event} evt
   */
  handleInputChange = event => {
    const { name, value } = event.target;
    const application = Object.assign({}, this.state.application, {
      [name]: value
    });

    this.setState({ application });
  };

  next(position) {
    const next = this.navigator.nextPosition(this.state.application, position);
    this.props.history.push(this.root_path + next.toURL());
  }

  reset = () => {
    this.props.history.push(
      this.root_path + this.navigator.initialPosition(this.state.application).toURL()
    );
  };

  /**
   * Merge new data into the application state
   * @param {Object} data
   */
  updateApplication = data => {
    const application = Object.assign({}, this.state.application, data);

    this.setState({ application });
  };

  render() {
    return (
      <main>
        <Switch>
          <Route exact path="/">
            <Redirect
              to={this.root_path + this.navigator.initialPosition(this.state.application).toURL()}
            />
          </Route>
          <Route
            path={this.root_path} // whatever part of your site you want to navigate with your graph
            render={props => {
              const position = this.navigator.createPositionFromURL(
                this.state.application,
                props.location.pathname.substring(this.root_path.length)
              );
              return (
                <Page
                  application={this.state.application}
                  handleInputChange={this.handleInputChange}
                  position={position}
                  next={() => this.next(position)}
                  reset={this.reset}
                  updateApplication={this.updateApplication}
                />
              );
            }}
          />
        </Switch>
      </main>
    );
  }
}

export default withRouter(App);
