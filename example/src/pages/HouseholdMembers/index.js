import React from "react";

class HouseholdMembers extends React.Component {
  handleAddMemberClick = () => {
    const householdMembers = this.props.application.householdMembers;

    // Add an entry to the household members collection
    householdMembers.push({
      id: householdMembers.length + 1
    });
    this.props.updateApplication({
      householdMembers
    });
  };

  render() {
    return (
      <React.Fragment>
        <p>
          Tell us about everyone who lives in your home, even if they're not there all the time.
        </p>
        <ul>
          <li>{this.props.application.userFullName} (that's you!)</li>
          {/* {this.props.application.householdMembers.map((person, index) => (
            <li key={index}>{person.name}</li>
          ))} */}
        </ul>
        <button onClick={this.handleAddMemberClick}>+ Add a member</button>
      </React.Fragment>
    );
  }
}

export default HouseholdMembers;
