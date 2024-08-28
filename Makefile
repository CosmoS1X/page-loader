install: deps-install link

deps-install:
	npm ci

link:
	npm link

check: lint test

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage

run:
	node bin/page-loader.js

publish:
	npm publish --dry-run

.PHONY: test
