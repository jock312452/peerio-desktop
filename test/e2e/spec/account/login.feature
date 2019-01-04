Feature: Login

    Scenario: Autologin
        Given I have signed up
        And   I close Peerio
        When  I open Peerio
        Then  I am taken to the home tab
