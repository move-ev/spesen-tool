// Stand-in for the `server-only` package under vitest's plain Node
// environment. `server-only`'s default export throws unconditionally unless
// the "react-server" condition (set by Next.js's bundler) is active; aliasing
// the bare specifier to this empty module — rather than flipping a resolve
// condition for the whole process — keeps every other package's export
// resolution untouched.
export {};
