install: deps-install build link

deps-install:
	npm install

link:
	npm link

type-check:
	npm run type-check

lint:
	npm run lint

lint-fix:
	npm run lint:fix

test:
	npm run test

test-coverage:
	npm run test:coverage

check: type-check test lint
	@echo "All checks passed!"

clean:
	npm run clean

build: clean
	npm run build

publish:
	npm publish --dry-run

.PHONY: test
