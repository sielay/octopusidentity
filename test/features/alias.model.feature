Feature: Alias Model

  Scenario: read
    Given database is empty
    When I create 10 random aliases
    Then I can retrieve them

  Scenario: duplicates
    Given database is empty
    When I create 10 random aliases
    Then I can't save identical

  Scenario: user
    Given database is empty
    When I attach aliases to 10 random users
    Then I can retrieve users by aliases
    Then I can retrieve aliases by users
    Then I can't attach others users to the same aliases
    Then I can override those aliases
    Then I can retrieve users by aliases
    Then I can retrieve aliases by users

  Scenario: Clearing test resources
    Given Skip
    When Skip
    Then Disconnect