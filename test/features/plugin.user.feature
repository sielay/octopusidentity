Feature: Keep compatibility with mongoose-plugin

  Scenario: 1 - Mongoose User Plugin usage - create user
    Given database is clean
    When I create user by email lukaszsielski@gmail.com and sTr0nGpA55w0rD password using mongoose plugin
    Then I can authorise user with email lukaszsielski@gmail.com and sTr0nGpA55w0rD password

  Scenario: 2 - Mongoose User Plugin usage - wrong credentials
    Given database is clean
    When I create user by email lukaszsielski@gmail.com and sTr0nGpA55w0rD password using mongoose plugin
    Then I can't authorise user with email lukaszsielski@gmail.com and 0tH3rPa55w0rD password

  Scenario: 3 - Mongoose User Plugin usage - wrong credentials 2
    Given database is clean
    When I create user by email lukaszsielski@gmail.com and sTr0nGpA55w0rD password using mongoose plugin
    Then I can't authorise user with email lukaszsi.vels.ki123@gmail.com and sTr0nGpA55w0rD password

  Scenario: 4 - Octopus test massive user creation and autherisation
    Given database is clean
    When I create 3 random users each kind
    Then I can authorise each user with valid credentials
    Then I can't authorise each user with invalid credentials
    Then I can't authorise each user with other credentials

  Scenario: Clearing test resources
    Given Skip
    When Skip
    Then Disconnect