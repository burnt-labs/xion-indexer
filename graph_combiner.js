const fs = require("fs");
const { loadSchemaSync } = require("@graphql-tools/load");
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader");
const { printSchemaWithDirectives } = require("@graphql-tools/utils");

const schema = loadSchemaSync("./schema.graphql", {
  loaders: [new GraphQLFileLoader({assumeValidSDL: true, assumeValid: true})],
});
fs.writeFileSync("combined.graphql", printSchemaWithDirectives(schema));