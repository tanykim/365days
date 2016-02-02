# [Work In Progress] 365days

This website produces a poster-size printable visualization of your home(s), work place(s), and other frequently visited powered by [Moves App](https://www.moves-app.com).
        
This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.14.0.

## Prepare for data
The data source is acquired through a smart phone app, Moves. You need to export yoru data first from your app.

Sign in with your Moves account at [https://account.moves-app.com](https://account.moves-app.com)

Once you download your data, extract json.zip. Copy folder `json/yearly/places` folder under `app/data` ('places' folder is locates at the same level of placeholder.txt.)    

## Setup
Install Grunt environment and JS libraries.

```
npm install
bower install
```

## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.
