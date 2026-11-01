.PHONY: run test package assets build
run:
	python3 serve.py
test:
	node --test tests/*.test.mjs
	python3 -m unittest discover -s tests -p 'test_*.py'
package:
	python3 scripts/package.py
assets:
	node scripts/asset-catalog.mjs
build:
	node scripts/build.mjs
