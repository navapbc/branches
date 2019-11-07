/**
 * Filter/condition functions are used to conditionally route users to pages
 */
function notResident(data) {
  return data.isResident !== "yes";
}

/**
 * Sections represent groups of pages within the site that the
 * user will progress through
 */
const screenerSection = {
  _control: {
    initialNode: "welcome"
  },
  welcome: {
    _control: {
      next: "stateResidency"
    },
    component: "Welcome",
    content: {
      title: "Welcome to the demo"
    }
  },
  stateResidency: {
    _control: {
      next: [{ key: "nonResident", condition: "notResident" }]
    },
    component: "StateResidency"
  },
  nonResident: {
    component: "NonResidentRedirect",
    content: {
      title: "Apply for health coverage and food assistance."
    }
  }
};

const userSection = {
  _control: { initialNode: "profile" },
  profile: {
    component: "UserProfile",
    content: {
      title: "Tell us about yourself"
    }
  }
};

const householdSection = {
  _control: {
    initialNode: "householdMembers"
  },
  householdMembers: {
    _control: {
      next: "householdMemberProfile"
    },
    component: "HouseholdMembers",
    content: {
      title: "Who do you currently live with?"
    },
    householdMemberProfile: {
      _control: {
        // This doesn't currently work for looping
        collectionPath: "householdMembers"
      },
      component: "HouseholdMemberProfile",
      content: {
        title: "Add a person you want to apply with."
      }
    }
  }
};

const expensesSection = {
  _control: {
    initialNode: "expenses"
  },
  expenses: {
    component: "Expenses",
    content: {
      title: "What kind of housing expenses do you have?"
    }
  }
};

module.exports = {
  filters: { notResident },
  sections: {
    expenses: expensesSection,
    household: householdSection,
    screener: screenerSection,
    user: userSection
  },
  // Array of property names from `sections` above
  sectionOrdering: ["screener", "user", "household", "expenses"]
};
