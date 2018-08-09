import React from "react";
import ReactDOM from "react-dom";
import "./css/index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import Navigator from "./lib/Navigator";
import graphData from "./graph";
import { Router, Route, Switch, Redirect } from "react-router";
import createHistory from "history/createBrowserHistory";

const GRAPH_ROOT = "/graph/";
const applicationState = {};
const navigator = new Navigator({ ...graphData, filters: [] });
const history = createHistory();

const next = position => {
  const next = navigator.nextPosition(applicationState, position);
  history.push(GRAPH_ROOT + next.toURL());
};

const reset = () => {
  history.push(GRAPH_ROOT + navigator.initialPosition(applicationState).toURL());
};

ReactDOM.render(
  <Router history={history}>
    <main>
      <Switch>
        <Route exact path="/">
          <Redirect to={GRAPH_ROOT + navigator.initialPosition(applicationState).toURL()} />
        </Route>
        <Route
          path={GRAPH_ROOT} // whatever part of your site you want to navigate with your graph
          render={props => {
            const { location } = props;
            const position = navigator.createPositionFromURL(
              applicationState,
              location.pathname.substring(GRAPH_ROOT.length)
            );
            return (
              <App
                position={position}
                history={history}
                next={() => next(position)}
                reset={reset}
              />
            );
          }}
        />
      </Switch>
    </main>
  </Router>,
  document.getElementById("root")
);
registerServiceWorker();
