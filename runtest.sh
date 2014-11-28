#!/bin/bash
./node_modules/cucumber/bin/cucumber.js --name ./test/features/$1.feature -format=summary --require ./test/step_definitions/$1.js