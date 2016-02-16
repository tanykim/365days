# [Work In Progress] 365days

This website produces a poster-size printable visualization of your home(s), work place(s), and other frequently visited powered by [Moves App](https://www.moves-app.com).

This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 3.0.0-rc8.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and NPM](nodejs.org) >= v0.12.0
- [Bower](bower.io) (`npm install --global bower`)
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)

## Developing

1. Run `npm install` to install server dependencies.

2. Run `bower install` to install front-end dependencies.

3. Run `grunt serve` to start the development server. It should automatically open the client in your browser when ready.

## Prepare for data
The data source is acquired through a smart phone app, Moves. You need to export yoru data first from your app.

Sign in with your Moves account at [https://account.moves-app.com](https://account.moves-app.com)

Once you download your data, extract json.zip. Copy folder `json/yearly/places` folder under `client/data` ('places' folder is locates at the same level of placeholder.txt.)

## Build & development

Run `grunt build` for building and `grunt serve` for preview.

## Testing

Running `npm test` will run the unit tests with karma.