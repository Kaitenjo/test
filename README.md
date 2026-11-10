# xaendar-grid-app

Angular 21 app showing the Xaendar grid (`xd-grid`), the port of the Optimus UI table. Its twin `optimus-grid-app` shows the same example with the Optimus UI table.

## Layout

- `xaendar/` is a self-contained Xaendar workspace (own `package.json`, TypeScript 6 and Vitest 5, which Angular 21 cannot share). It holds the library `libraries/ui-kit` (`xd-grid`, `xd-paginator`, `xd-scroller`, ...) and a test host; see `xaendar/libraries/ui-kit/README.md`.
- `xd build` (run by `npm run build:xaendar`) compiles the library ahead of time into `xaendar/dist/ui-kit`, which the app installs as the dependency `@xaendar/ui-kit` (`file:xaendar/dist/ui-kit`, a symlink: `preserveSymlinks` in `angular.json` makes it resolve `@xaendar/core` from the app, so there is a single copy).
- `src/main.ts` calls `loadSignals()` and only then loads `src/bootstrap.ts` with a dynamic import: Xaendar needs its signals installed before `@xaendar/core` is evaluated.
- `src/bootstrap.ts` imports `@xaendar/ui-kit/xd-grid/xd-grid.xd.component`, which defines `xd-grid` and everything its template uses. The barrel `@xaendar/ui-kit` is declared free of side effects and would be dropped by the bundler.
- `src/app/app.html` uses the element with `CUSTOM_ELEMENTS_SCHEMA` and binds its inputs as properties: `<xd-grid [value]="rows()" [columns]="columns()">`.

## Commands

```bash
npm install                  # app dependencies
npm --prefix xaendar install # Xaendar workspace dependencies
npm run build:xaendar        # compile the library into xaendar/dist/ui-kit (also run by prestart and prebuild)
npm start                    # ng serve
npm test                     # Angular spec of the app
npm run test:xaendar         # specs of the library
```
