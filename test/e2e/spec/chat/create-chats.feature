Feature: Create new chat
    Background: Helper user exists and I am logged in
        Given A helper user is created
        And I log in

    Scenario: Create DM successfully
        When I start a DM with a user
        Then I can send a message to the current chat
        When I navigate to Contacts
        Then they are in my contacts

    Scenario: Create room successfully
        When I create a new room
        Then I can send a message to the current chat
