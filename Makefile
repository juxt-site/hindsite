.PHONY: all

all:	htmx/htmx.min.js

htmx/htmx.min.js:
	mkdir -p htmx
	curl -L -o $@ 'https://unpkg.com/htmx.org@1.8.5'
