#.PHONY: all build check build-nodejs build-web build-docker clean serve-client run npm-install clean-files build-docker serve
.PHONY: \
	all \
	build \
	build-client \
	build-processor \
	build-docker \
	build-docker-sandbox \
	check \
	run \
	run-client-server \
	run-processor-daemon \
	run-provider-server \
	run-sandbox

all: build

build: build-processor build-provider build-client

build-processor: build-deps
	make -C processor build

build-provider: build-deps
	make -C provider build

build-client: build-deps
	make -C client build

build-deps:
	make -C deps build

build-docker: build
	make -C processor/daemon build-docker
	make -C provider build-docker
	make -C client build-docker

build-docker-sandbox:
	docker build -t alias/sandbox -f docker/Dockerfile .

check:
	make -C processor check

clean:
	make -C client clean
	make -C provider clean
	make -C deps clean
	make -C processor clean
	rm -rf root

### Debug run shortcuts

run:
	docker-compose -f docker/docker-compose.yml up

# set listening port with env var ALIAS_PROCESSOR_DAEMON_PORT
run-processor-daemon:
	make -C processor/daemon run

run-client-server:
	make -C client run

# set listening port with env var ALIAS_AUTHZ_PORT
run-provider-server:
	make -C provider run

run-sandbox:
	docker run -it --rm -v `pwd`:/alias alias/sandbox /bin/bash
