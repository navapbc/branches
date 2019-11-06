import Page from "./Page";
import React from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import Navigator from "branches";
import graphData from "./graph";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.GRAPH_ROOT = "/graph/";
    this.navigator = new Navigator({ ...graphData, filters: [] });
    this.state = {
      application: {}
    };
  }

  next(position) {
    const next = this.navigator.nextPosition(this.state.application, position);
    this.props.history.push(this.GRAPH_ROOT + next.toURL());
  }

  reset = () => {
    this.props.history.push(
      this.GRAPH_ROOT + this.navigator.initialPosition(this.state.application).toURL()
    );
  };

  render() {
    return (
      <main>
        <Switch>
          <Route exact path="/">
            <Redirect
              to={this.GRAPH_ROOT + this.navigator.initialPosition(this.state.application).toURL()}
            />
          </Route>
          <Route
            path={this.GRAPH_ROOT} // whatever part of your site you want to navigate with your graph
            render={props => {
              const { location } = props;
              const position = this.navigator.createPositionFromURL(
                this.state.application,
                location.pathname.substring(this.GRAPH_ROOT.length)
              );
              return (
                <Page position={position} next={() => this.next(position)} reset={this.reset} />
              );
            }}
          />
        </Switch>
      </main>
    );
  }
}

export default withRouter(App);
