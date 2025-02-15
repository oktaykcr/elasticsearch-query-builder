# Elasticsearch Query Builder

Elasticsearch Query Builder is a web application that allows you to easily create data queries in JSON format. This project was developed entirely using [Cursor AI](https://cursor.sh/), demonstrating the capabilities of AI-assisted development.

## Features

- Easy query creation
- Add conditions and create nested conditions
- Save and edit queries
- Search saved queries
- Export/Import queries to JSON format
- Language support (English, Turkish)
- Light/Dark theme support
- JSON format output
- Copy queries

## Installation

To run the project in your local environment:

1. Clone the repository
   ```bash
   git clone https://github.com/oktaykcr/elasticsearch-query-builder.git
   ```
2. Go to project directory
   ```bash
   cd elasticsearch-query-builder
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Start the application
   ```bash
   npm start

The application will run at http://localhost:3000

## Usage

1. Click "Add Condition" button to add a new condition
2. Select condition type and values
3. Use "Add Nested" button for nested conditions
4. Click "Generate" button to create the query
5. Save or copy the generated query

## Demo

You can access the live demo of the application [here](https://oktaykcr.github.io/elasticsearch-query-builder).

## Technologies

- React
- TypeScript
- Bootstrap
- LocalStorage
- [Cursor AI](https://cursor.sh/) for development

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.