import React from "react";

function PageContent() {
  return (
    <React.Fragment>
      <p>This site is for Michigan residents only. To apply for coverage in your state:</p>
      <ul>
        <li>
          <a href="https://healthcare.gov">Visit Healthcare.gov for health coverage</a>
        </li>
        <li>
          <a href="https://FNS.USDA.gov">Visit FNS.USDA.gov for food assistance</a>
        </li>
      </ul>
    </React.Fragment>
  );
}

export default PageContent;
