.PHONY: all clobber

all:	htmx/htmx.min.js

clobber:
	rm -rf htmx

htmx/htmx.min.js:
	mkdir -p htmx
	curl -L -o $@ 'https://unpkg.com/htmx.org@1.8.5'
