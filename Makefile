setup: s3
	mkdir -p ./build
	touch ./sync.d

all: s3
	# Pass

commoncore:
	./sync.d Math.CC

clean: s3_clean
	rm -f ./build/*png
	rm -f ./build/*json

s3:
	git submodule update --init
	cd libs3 && make

s3_clean:
	cd libs3 && make clean
