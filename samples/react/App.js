import React, { Component, Fragment } from "react";

class App extends Component {
  render() {
    const { position, next, reset } = this.props;
    if (position.isEnd()) {
      return (
        <Fragment>
          <h1 className="ds-h1">End of cycle (or bad path)</h1>
          <button onClick={reset}>Restart</button>
        </Fragment>
      );
    }
    return (
      <Fragment>
        <h1 className="ds-h1">{`${position.activeNode().name} ${position.sectionKey()}`}</h1>
        <button onClick={next}>Next</button>
      </Fragment>
    );
  }
}

export default App;
