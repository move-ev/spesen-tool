# @zemio/typescript-config

Shared TypeScript configuration for the monorepo.

## Available Configs

### `base.json`
Base TypeScript configuration with common compiler options shared across all packages:
- Strict mode enabled
- ES2022 target
- ESNext module system
- Bundler module resolution

### `nextjs.json`
Extends `base.json` with Next.js-specific settings:
- DOM and DOM.Iterable libraries
- React JSX support
- Next.js plugin integration

### `react-library.json`
Extends `base.json` for React library packages:
- DOM and DOM.Iterable libraries
- React JSX support

## Usage

In your package's `tsconfig.json`, extend from the appropriate config:

### For Next.js apps:
```json
{
  "extends": "../../packages/typescript-config/nextjs.json",
  "compilerOptions": {
    // Your app-specific options
  }
}
```

### For React libraries:
```json
{
  "extends": "../typescript-config/react-library.json",
  "compilerOptions": {
    // Your library-specific options
  }
}
```

## Customization

Each package can override or extend the shared configuration by adding options to their own `compilerOptions`. Common customizations include:
- `paths` - Module path aliases
- `baseUrl` - Base directory for path resolution
- `include` - Files to include in compilation
