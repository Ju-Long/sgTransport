# sgBus

![Alt Text](./assets/loading.gif)

## Description

This is the repo for Singapore Transport like Bus, Train, etc... This API will be non-commercialised and only accept donations. It is hosting on https://transport.babasama.com and the existing [path](#paths) and code is all available open source on github.

It is an NodeJS application with [redis](https://redis.io) as a caching server database and [got](https://github.com/sindresorhus/got) as a http request library. See the npm package @ package.json. 

Note: ALL the url links are publicly available. [Resources below](#resources).

Do you want to host it yourself instead? [Sure you can](#how-do-i-use-it-at-my-own-server-or-localhost)

## Paths

- `GET NEAREST BUS STOP` - ``` https://transport.babasama.com/bus/nearest/:page?lat=_&long=_ ```
  - Parameter :page, lat and long is required, page min is 1, no maximum, it will just return the same result as the final call.
  - Example: https://transport.babasama.com/bus/nearest/1?lat=1&long=103

- `GET BUS STOP TIMING` - ``` https://transport.babasama.com/bus/timing/BusStop/:BusStopCode ```
  - Parameter :BusStopCode is required, a valid Bus Stop Code is required.
  - Note: if there are no service available, result will return empty array.
  - Example: https://transport.babasama.com/bus/timing/BusStop/77211

- `SEARCH FOR BUS STOP` - ``` https://transport.babasama.com/bus/search/BusStop/:BusStopCode ```
  - Parameter: :BusStopCode is required, a non valid Bus Stop Code is accepted. It will search for the similar Bus Stop Code with the pattern inputted.
  - Example: https://transport.babasama.com/bus/search/BusStop/77

- `SEARCH FOR BUS` - ``` https://transport.babasama.com/bus/search/Bus/:ServiceNo ```
  - Parameter: :ServiceNo is required, a non valid Service No is accepted.It will search for the similar Service No with the pattern inputted.
  - Example: https://transport.babasama.com/bus/search/Bus/8

- `GET INFOMATION BETWEEN BUS STOP CODE` - ``` https://transport.babasama.com/bus/distance/BusStop/:StartBusStopCode/:EndBusStopCode ```
  - Parameter: :StartBusStopCode and :EndBusStopCode is required, a valid Bus Stop Code is required.
  - Example https://transport.babasama.com/bus/distance/BusStop/52509/77199

- `GET INFOMATION BETWEEN BUS STOP CODE WITH BUS FILTER` - ``` https://transport.babasama.com/bus/distance/Bus/:ServiceNo/:StartBusStopCode/:EndBusStopCode ```
  - Parameter: :ServiceNo, :StartBusStopCode and :EndBusStopCode is required, a valid Bus Stop Code is required.
  - Example https://transport.babasama.com/bus/distance/Bus/88/52509/77199

More to come...

## How do I use it at my own server or localhost?
Preparations: 
- ensure you have 
  - [redis](https://redis.io/)
  - [nodejs](https://nodejs.org/en/) 
- installed and working, else you cant run... [unless](https://www.reddit.com/r/YouFellForItFool/comments/cjlngm/you_fell_for_it_fool/)

You can fork / clone this repo, npm install, make a copy of .env from example.env and node app.js. It is hosted on port 3002. btw the start.sh and pull.sh is made so at server side its easier to pull and start with [forever](https://www.npmjs.com/package/forever)

## Resources
- [Datamall API](https://datamall.lta.gov.sg/content/datamall/en.html)
- [SMRT Timing Medium.com Post](https://chatbotslife.com/make-google-assistant-app-to-check-train-arrival-times-with-dialogflow-71cf02103e8)
