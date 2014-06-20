
dirs:
	mkdir -p build/raw build/types build/struggling build/mastered build/working build/small

clean: 
	rm -f ./build

.PHONY: clean dirs
