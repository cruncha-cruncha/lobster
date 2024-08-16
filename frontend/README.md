# Frontend

Written in React and vanilla JS.

At the time this project was concieved, I was frustrated with typescript. I found that it got in the way and made false promises. Now I desperatly miss it's type hints in VS code. I did want run-time type-checking on data coming in over the network, to pre-empt a certain class of error. In comes [ajv](https://www.npmjs.com/package/ajv) to the rescue. All network requests live in the /src/api folder, and follow a consistent pattern.

Files in the /src/pages folder generally contain three functions: a hook, a pure ui function, and a tiny function that combines them. Other functions are written as needed, or they might be split up. The hook contains all logic, handlers, data formatters, and network requests. The pure ui function contains only a return statement with jsx, if, .map(), and ternary operators. All variable access uses [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining). The tiny combination function always looks similar to:

```
export const Login = (props) => {
  const login = useLogin(props);
  return <PureLogin {...login} />;
};
```

This pattern promotes code re-use, separation of concerns, and type-safety. It's worked well so far, I'm happy to have thought it up.

I wrote the "router" myself, and it incorporates some slick slide in/out/up/down/left/right page transitions. This will likely have to be re-written for performance. I've just added [jotai](https://www.npmjs.com/package/jotai) for global state. I want to keep dependencies to a minimum for ease of updating in the future.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
