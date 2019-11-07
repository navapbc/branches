import React from "react";

function PageContent(props) {
  const key = props.position.activeCollectionKey();
  const allCollectionKeys = props.position.allCollectionKeys();

  console.log("activeCollectionKey", key);
  console.log("allCollectionKeys", allCollectionKeys);

  return (
    <form>
      <label>
        Full name
        <input
          name={`householdMembers[${key}][name]`}
          onChange={props.handleInputChange}
          type="text"
          value={props.application["todo"] || ""}
        />
      </label>
    </form>
  );
}

export default PageContent;
