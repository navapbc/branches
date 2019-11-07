import React from "react";

function PageContent(props) {
  return (
    <form>
      <fieldset>
        <legend>Do you currently reside in Michigan?</legend>
        <p>
          If not, we’ll help point you in the right direction. However, this application is
          specifically for current residents of Michigan.
        </p>
        <label>
          <input
            checked={props.application.isResident === "yes"}
            name="isResident"
            onChange={props.handleInputChange}
            type="radio"
            value="yes"
          />
          Yes
        </label>

        <label>
          <input
            checked={props.application.isResident === "no"}
            name="isResident"
            onChange={props.handleInputChange}
            type="radio"
            value="no"
          />
          No
        </label>
      </fieldset>
    </form>
  );
}

export default PageContent;
