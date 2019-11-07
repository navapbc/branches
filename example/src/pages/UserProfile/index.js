import React from "react";

function PageContent(props) {
  return (
    <form>
      <label>Full name</label>
      <input
        name="userFullName"
        onChange={props.handleInputChange}
        type="text"
        value={props.application["userFullName"] || ""}
      />
    </form>
  );
}

export default PageContent;
