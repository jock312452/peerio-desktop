Feature: Signup

    Scenario: User signs up successfully
        When I choose the create account option
        And  I input my personal info
        Then I am presented with my passcode
        Then I am taken to the home tab
