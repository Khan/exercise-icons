import std.conv;
import std.json;
import std.traits;

/**
 * Utility to transform the following into a JSONValue:
 *  - 'int's
 *  - 'long's
 *  - 'uint's'
 *  - 'ulong's
 *  - 'float's
 *  - 'string's
 *  - 'bool's
 *  - static and dynamic arrays with any of these types
 *  - iterables with any of these types with to!string()-able keys
 *  - data from classes or structs with only these types
 */
JSONValue jsonify(T)(T t) {
    JSONValue ret = JSONValue();
    static if (is(T == string)) {
        ret.str = t;
        return ret;
    } else static if (is(T == int) || is(T == long)) {
        ret.integer = t;
        return ret;
    } else static if (is(T == uint) || is(T == ulong)) {
        ret.uinteger = t;
        return ret;
    } else static if (is(T == float) || is(T == double)) {
        ret.floating = t;
        return ret;
    } else static if (is(T == bool)) {
        if (t) {
            ret = true;
        } else {
            ret = false;
        }
        return ret;
    } else static if (isStaticArray!(T) || isDynamicArray!(T)) {
        JSONValue arr[];
        foreach (v; t) {
            arr ~= jsonify(v);
        }
        ret.array = arr;
        return ret;
    } else static if (isIterable!(T)) {
        JSONValue[string] reto;

        foreach (k, v; t) {
            reto[k.to!string()] = jsonify(v);
        }
        ret.object = reto;
        return ret;
    } else {
        JSONValue[string] reto;

        enum members = [ __traits(allMembers, T) ];
        foreach (I, TYPE; typeof(T.tupleof)) {
            auto val =
                __traits(getMember, t, __traits(identifier, T.tupleof[I]));

            reto[__traits(identifier, T.tupleof[I])] =
                jsonify(val);
        }
        reto["__type__"] = jsonify(T.stringof);
        ret.object = reto;
        return ret;
    }
}
